from app.core.database import SessionLocal, engine
from app import models, crud, schemas

models.Base.metadata.create_all(bind=engine)

def init():
    db = SessionLocal()
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        user_in = schemas.UserCreate(
            username="admin",
            password="admin_password_123",
            role=models.Role.ADMIN
        )
        crud.create_user(db, user_in)
        print("Admin user created")
    else:
        print("Admin user already exists")
    db.close()

if __name__ == "__main__":
    init()