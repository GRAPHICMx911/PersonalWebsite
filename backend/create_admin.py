import getpass
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy import select
from backend.app.core.security import get_password_hash
from backend.app.database import SessionLocal, Base, engine
from backend.app.models.user import User


def create_admin():
    print("=" * 55)
    print("  PERSONAL GLOBAL WEBSITE — CREATE ADMIN USER")
    print("=" * 55)

    Base.metadata.create_all(bind=engine)

    username = input("Admin username: ").strip()
    email = input("Admin email: ").strip()
    full_name = input("Full name: ").strip()

    password = getpass.getpass("Admin password: ")
    confirm_password = getpass.getpass("Confirm password: ")

    if not username:
        print("[!] Error: Username cannot be empty.")
        return

    if not email:
        print("[!] Error: Email cannot be empty.")
        return

    if not password:
        print("[!] Error: Password cannot be empty.")
        return

    if password != confirm_password:
        print("[!] Error: Passwords do not match.")
        return

    if len(password) < 8:
        print("[!] Error: Password must contain at least 8 characters.")
        return

    db = SessionLocal()
    try:
        existing_username = db.scalar(
            select(User).where(User.username == username)
        )
        if existing_username:
            print(f"[!] Error: Username '{username}' already exists.")
            return

        existing_email = db.scalar(
            select(User).where(User.email == email)
        )
        if existing_email:
            print(f"[!] Error: Email '{email}' already exists.")
            return

        admin_user = User(
            username=username,
            email=email,
            full_name=full_name or None,
            password_hash=get_password_hash(password),
            is_active=True,
            is_superuser=True,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print()
        print("=" * 55)
        print("  ADMIN ACCOUNT CREATED SUCCESSFULLY")
        print("=" * 55)
        print(f"  ID:        {admin_user.id}")
        print(f"  Username:  {admin_user.username}")
        print(f"  Email:     {admin_user.email}")
        print(f"  Full Name: {admin_user.full_name}")
        print("=" * 55)

    except Exception as error:
        db.rollback()
        print("\n[!] Error creating admin account:")
        print(error)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()