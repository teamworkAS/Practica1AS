import mysql.connector
import os

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "185.232.14.52"),
        database=os.getenv("DB_NAME", "u760464709_23005116_bd"),
        user=os.getenv("DB_USER", "u760464709_23005116_usr"),
        password=os.getenv("DB_PASS", "z8[T&05u")
    )
