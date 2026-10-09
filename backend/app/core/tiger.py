"""
Tiger Data (PostgreSQL / TimescaleDB) connection layer and query engine.
Connects directly to Tiger Cloud to provide ultra-fast query execution,
time-series analytics, and full Supabase-compatible table query building.
"""
import os
import re
import json
import logging
from typing import Any, Dict, List, Optional
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, Json
from app.core.config import settings

logger = logging.getLogger(__name__)

_connection_pool: Optional[pool.SimpleConnectionPool] = None

def get_tiger_conn_url() -> str:
    raw = (
        os.environ.get("TIGER_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or settings.TIGER_DATABASE_URL
        or settings.DATABASE_URL
    )
    return str(raw).strip().strip('"').strip("'").strip()

def get_db_pool() -> pool.SimpleConnectionPool:
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        url = get_tiger_conn_url()
        _connection_pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=url
        )
    return _connection_pool

def execute_query(query: str, params: tuple = None) -> List[Dict[str, Any]]:
    """Execute a raw SQL query on Tiger Data and return results as dicts."""
    db_pool = get_db_pool()
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            if cur.description:
                rows = cur.fetchall()
                return [dict(r) for r in rows]
            conn.commit()
            return []
    finally:
        db_pool.putconn(conn)

class QueryResult:
    def __init__(self, data: List[Dict[str, Any]], count: Optional[int] = None):
        self.data = data
        self.count = count if count is not None else len(data)

class TigerTableQuery:
    """Supabase-compatible query builder backed by Tiger Data PostgreSQL."""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self._select_cols = "*"
        self._filters: List[str] = []
        self._params: List[Any] = []
        self._order_by: Optional[str] = None
        self._limit: Optional[int] = None
        self._single = False
        self._count_exact = False
        self._mode = "select"
        self._insert_data = None
        self._update_data = None
        self._on_conflict = None

    def select(self, cols: str = "*", count: Optional[str] = None):
        self._mode = "select"
        self._select_cols = cols
        if count == "exact":
            self._count_exact = True
        return self

    def eq(self, column: str, value: Any):
        self._filters.append(f'"{column}" = %s')
        self._params.append(value)
        return self

    def neq(self, column: str, value: Any):
        self._filters.append(f'"{column}" != %s')
        self._params.append(value)
        return self

    def ilike(self, column: str, pattern: str):
        self._filters.append(f'"{column}" ILIKE %s')
        self._params.append(pattern)
        return self

    def in_(self, column: str, values: List[Any]):
        if not values:
            self._filters.append("1=0")
        else:
            placeholders = ", ".join(["%s"] * len(values))
            self._filters.append(f'"{column}" IN ({placeholders})')
            self._params.extend(values)
        return self

    def order(self, column: str, desc: bool = False):
        direction = "DESC" if desc else "ASC"
        self._order_by = f'"{column}" {direction}'
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def single(self):
        self._single = True
        self._limit = 1
        return self

    def upsert(self, data: Any, on_conflict: Optional[str] = None):
        self._mode = "upsert"
        self._insert_data = data if isinstance(data, list) else [data]
        self._on_conflict = on_conflict
        return self

    def insert(self, data: Any):
        self._mode = "insert"
        self._insert_data = data if isinstance(data, list) else [data]
        return self

    def update(self, data: Dict[str, Any]):
        self._mode = "update"
        self._update_data = data
        return self

    def delete(self):
        self._mode = "delete"
        return self

    def execute(self) -> QueryResult:
        db_pool = get_db_pool()
        conn = db_pool.getconn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                where_clause = ""
                if self._filters:
                    where_clause = " WHERE " + " AND ".join(self._filters)

                if self._mode == "select":
                    # Handle basic nested relation syntax e.g. "*, unified_profiles(source_coverage)"
                    cols_to_fetch = "*"
                    if self._select_cols and "(" not in self._select_cols:
                        cols_to_fetch = self._select_cols

                    query = f'SELECT {cols_to_fetch} FROM "{self.table_name}"{where_clause}'
                    if self._order_by:
                        query += f" ORDER BY {self._order_by}"
                    if self._limit:
                        query += f" LIMIT {self._limit}"

                    cur.execute(query, tuple(self._params))
                    rows = [dict(r) for r in cur.fetchall()]

                    # Fetch simple joins if requested in select query (e.g. unified_profiles)
                    if "unified_profiles" in self._select_cols and self.table_name == "faculty":
                        for r in rows:
                            cur.execute('SELECT source_coverage FROM unified_profiles WHERE faculty_id = %s LIMIT 1;', (r["id"],))
                            up = cur.fetchone()
                            r["unified_profiles"] = dict(up) if up else {}

                    if "institutions" in self._select_cols and self.table_name == "faculty":
                        for r in rows:
                            inst_id = r.get("institution_id")
                            if inst_id:
                                cur.execute('SELECT id, name FROM institutions WHERE id = %s LIMIT 1;', (inst_id,))
                                inst = cur.fetchone()
                                r["institutions"] = dict(inst) if inst else {}

                    total_count = len(rows)
                    if self._count_exact:
                        cur.execute(f'SELECT count(*) as total FROM "{self.table_name}"{where_clause}', tuple(self._params))
                        total_count = cur.fetchone()["total"]

                    if self._single:
                        data = rows[0] if rows else None
                    else:
                        data = rows

                    return QueryResult(data=data, count=total_count)

                elif self._mode == "insert":
                    inserted_rows = []
                    for row in self._insert_data:
                        cols = list(row.keys())
                        col_names = ", ".join([f'"{c}"' for c in cols])
                        placeholders = ", ".join(["%s"] * len(cols))
                        values = [Json(v) if isinstance(v, (dict, list)) else v for v in row.values()]

                        q = f'INSERT INTO "{self.table_name}" ({col_names}) VALUES ({placeholders}) RETURNING *;'
                        cur.execute(q, values)
                        res = cur.fetchone()
                        if res:
                            inserted_rows.append(dict(res))
                    conn.commit()
                    return QueryResult(data=inserted_rows)

                elif self._mode == "upsert":
                    upserted_rows = []
                    for row in self._insert_data:
                        cols = list(row.keys())
                        col_names = ", ".join([f'"{c}"' for c in cols])
                        placeholders = ", ".join(["%s"] * len(cols))
                        values = [Json(v) if isinstance(v, (dict, list)) else v for v in row.values()]

                        if self._on_conflict:
                            conflict_cols = ", ".join([f'"{c.strip()}"' for c in self._on_conflict.split(",")])
                            non_conflict_cols = [c for c in cols if c not in [x.strip() for x in self._on_conflict.split(",")]]
                            if non_conflict_cols:
                                update_set = ", ".join([f'"{c}" = EXCLUDED."{c}"' for c in non_conflict_cols])
                                q = f'INSERT INTO "{self.table_name}" ({col_names}) VALUES ({placeholders}) ON CONFLICT ({conflict_cols}) DO UPDATE SET {update_set} RETURNING *;'
                            else:
                                q = f'INSERT INTO "{self.table_name}" ({col_names}) VALUES ({placeholders}) ON CONFLICT ({conflict_cols}) DO NOTHING RETURNING *;'
                        else:
                            q = f'INSERT INTO "{self.table_name}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING RETURNING *;'

                        cur.execute(q, values)
                        res = cur.fetchone()
                        if res:
                            upserted_rows.append(dict(res))
                        else:
                            upserted_rows.append(row)
                    conn.commit()
                    return QueryResult(data=upserted_rows)

                elif self._mode == "update":
                    set_parts = []
                    values = []
                    for k, v in self._update_data.items():
                        set_parts.append(f'"{k}" = %s')
                        values.append(Json(v) if isinstance(v, (dict, list)) else v)

                    values.extend(self._params)
                    q = f'UPDATE "{self.table_name}" SET {", ".join(set_parts)}{where_clause} RETURNING *;'
                    cur.execute(q, values)
                    rows = [dict(r) for r in cur.fetchall()]
                    conn.commit()
                    return QueryResult(data=rows)

                elif self._mode == "delete":
                    q = f'DELETE FROM "{self.table_name}"{where_clause} RETURNING *;'
                    cur.execute(q, tuple(self._params))
                    rows = [dict(r) for r in cur.fetchall()]
                    conn.commit()
                    return QueryResult(data=rows)

        finally:
            db_pool.putconn(conn)

class TigerClient:
    """Unified client providing table access and raw query execution."""

    def table(self, table_name: str) -> TigerTableQuery:
        return TigerTableQuery(table_name)

    def query(self, sql: str, params: tuple = None) -> List[Dict[str, Any]]:
        return execute_query(sql, params)

_tiger_client_instance = None

def get_tiger_client() -> TigerClient:
    global _tiger_client_instance
    if _tiger_client_instance is None:
        _tiger_client_instance = TigerClient()
    return _tiger_client_instance
