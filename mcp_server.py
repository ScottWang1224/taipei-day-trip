import os
from dotenv import load_dotenv

load_dotenv()

from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_headers
from database import get_database_connection
import mysql.connector

mcp = FastMCP("台北一日遊")


@mcp.tool(
    name="search_attractions",
    description="透過關鍵字和捷運站名搜尋台北市一日旅遊的景點",
)
def search_attractions(keyword: str):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                name,
                description
            FROM attractions
            WHERE name LIKE %s
               OR mrt = %s
            ORDER BY id
            """,
            (
                f"%{keyword}%",
                keyword,
            ),
        )

        attractions = cursor.fetchall()

        return {"data": attractions}

    except mysql.connector.Error:
        return {"error": True}

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@mcp.tool(
    name="create_booking",
    description="根據景點編號、日期、時間與價格，預定一個台北市景點導覽行程",
)
def create_booking(
    attraction_id: int,
    date: str,
    time: str,
    price: int,
):
    connection = None
    cursor = None

    try:
        # =========================
        # Get Bearer Token
        # =========================

        headers = get_http_headers(include={"authorization"})
        authorization = headers.get("authorization", "")

        if not authorization.startswith("Bearer "):
            return {"error": True}

        mcp_token = authorization[7:]

        # =========================
        # Validate Input
        # =========================

        if not attraction_id or not date or not time or not price:
            return {"error": True}

        if time not in ("morning", "afternoon"):
            return {"error": True}

        # =========================
        # Database
        # =========================

        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        # Find member by MCP token
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE mcp_token = %s
            """,
            (mcp_token,),
        )

        user = cursor.fetchone()

        if user is None:
            return {"error": True}

        user_id = user["id"]

        # Check attraction
        cursor.execute(
            """
            SELECT id
            FROM attractions
            WHERE id = %s
            """,
            (attraction_id,),
        )

        attraction = cursor.fetchone()

        if attraction is None:
            return {"error": True}

        # =========================
        # Create / Update Booking
        # =========================

        cursor.execute(
            """
            INSERT INTO bookings (
                user_id,
                attraction_id,
                date,
                time,
                price
            )
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                attraction_id = VALUES(attraction_id),
                date = VALUES(date),
                time = VALUES(time),
                price = VALUES(price)
            """,
            (
                user_id,
                attraction_id,
                date,
                time,
                price,
            ),
        )

        connection.commit()

        base_url = os.getenv("BASE_URL", "http://127.0.0.1:8000")
        booking_url = f"{base_url}/booking"
        return {
            "ok": True,
            "message": (f"台北導覽行程，預定成功，" f"請到 {booking_url} 完成付款。"),
        }

    except mysql.connector.Error as error:

        if connection:
            connection.rollback()

        return {"error": True}

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
