import json
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

load_dotenv()

JSON_FILE_PATH = Path("data/taipei-attractions.json")


def get_database_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )


def split_image_urls(img_host: str, raw_imgurls: str) -> list[str]:
    paths = raw_imgurls.split("/imgs/")

    return [f"{img_host}/imgs/{path}" for path in paths if path]


def import_attractions() -> None:
    connection = None
    cursor = None

    try:
        with JSON_FILE_PATH.open("r", encoding="utf-8") as file:
            raw_data = json.load(file)

        img_host = raw_data["img_host"]
        attractions = raw_data["list"]

        connection = get_database_connection()
        cursor = connection.cursor()

        attraction_sql = """
            INSERT INTO attractions (
                id,
                name,
                category,
                description,
                address,
                transport,
                mrt,
                lat,
                lng
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        image_sql = """
            INSERT INTO attraction_images (
                attraction_id,
                image_url
            )
            VALUES (%s, %s)
        """

        for attraction in attractions:
            attraction_values = (
                attraction["_id"],
                attraction["name"],
                attraction["CAT"],
                attraction["description"],
                attraction["address"],
                attraction.get("direction"),
                attraction.get("MRT"),
                float(attraction["latitude"]),
                float(attraction["longitude"]),
            )

            cursor.execute(attraction_sql, attraction_values)

            image_urls = split_image_urls(
                img_host,
                attraction["imgurls"],
            )

            for image_url in image_urls:
                cursor.execute(
                    image_sql,
                    (attraction["_id"], image_url),
                )

        connection.commit()
        print(f"Successfully imported {len(attractions)} attractions.")

    except (
        FileNotFoundError,
        KeyError,
        ValueError,
        json.JSONDecodeError,
        mysql.connector.Error,
    ) as error:
        if connection:
            connection.rollback()

        print(f"Import failed: {error}")

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    import_attractions()
