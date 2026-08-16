from fastapi import *
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

import mysql.connector
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

load_dotenv()


def get_database_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/categories")
def get_categories():
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT DISTINCT category
            FROM attractions
            ORDER BY category
        """)

        categories = [row[0] for row in cursor.fetchall()]

        return {"data": categories}

    except mysql.connector.Error:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "伺服器內部錯誤"},
        )

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.get("/api/mrts")
def get_mrts():
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT mrt
            FROM attractions
            WHERE mrt IS NOT NULL
              AND mrt != ''
            GROUP BY mrt
            ORDER BY COUNT(*) DESC, mrt ASC
        """)

        mrts = [row[0] for row in cursor.fetchall()]

        return {"data": mrts}

    except mysql.connector.Error:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "伺服器內部錯誤"},
        )

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.get("/api/attractions")
def get_attractions(
    page: int,
    category: str | None = None,
    keyword: str | None = None,
):
    connection = None
    cursor = None

    try:
        if page < 0:
            return JSONResponse(
                status_code=400,
                content={
                    "error": True,
                    "message": "頁碼不正確",
                },
            )

        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = []
        parameters = []

        if category:
            conditions.append("a.category = %s")
            parameters.append(category)

        if keyword:
            conditions.append("(a.name LIKE %s OR a.mrt = %s)")
            parameters.extend([f"%{keyword}%", keyword])

        where_clause = ""

        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        page_size = 8
        offset = page * page_size

        # 多查一筆，用來判斷是否還有下一頁
        query = f"""
            SELECT
                a.id,
                a.name,
                a.category,
                a.description,
                a.address,
                a.transport,
                a.mrt,
                a.lat,
                a.lng
            FROM attractions AS a
            {where_clause}
            ORDER BY a.id
            LIMIT %s OFFSET %s
        """

        parameters.extend([page_size + 1, offset])
        cursor.execute(query, tuple(parameters))

        attractions = cursor.fetchall()

        has_next_page = len(attractions) > page_size
        attractions = attractions[:page_size]

        for attraction in attractions:
            cursor.execute(
                """
                SELECT image_url
                FROM attraction_images
                WHERE attraction_id = %s
                ORDER BY id
                """,
                (attraction["id"],),
            )

            attraction["images"] = [row["image_url"] for row in cursor.fetchall()]

            attraction["lat"] = float(attraction["lat"])
            attraction["lng"] = float(attraction["lng"])

        return {
            "nextPage": page + 1 if has_next_page else None,
            "data": attractions,
        }

    except mysql.connector.Error:
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "伺服器內部錯誤",
            },
        )

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.get("/api/attraction/{attraction_id}")
def get_attraction(attraction_id: int):
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
                category,
                description,
                address,
                transport,
                mrt,
                lat,
                lng
            FROM attractions
            WHERE id = %s
            """,
            (attraction_id,),
        )

        attraction = cursor.fetchone()

        if attraction is None:
            return JSONResponse(
                status_code=400,
                content={"error": True, "message": "景點編號不正確"},
            )

        cursor.execute(
            """
            SELECT image_url
            FROM attraction_images
            WHERE attraction_id = %s
            ORDER BY id
            """,
            (attraction_id,),
        )

        attraction["images"] = [row["image_url"] for row in cursor.fetchall()]

        attraction["lat"] = float(attraction["lat"])
        attraction["lng"] = float(attraction["lng"])

        return {"data": attraction}

    except mysql.connector.Error:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "伺服器內部錯誤"},
        )

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")


@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")


@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./static/booking.html", media_type="text/html")


@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")
