from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./hospital.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
    
    
    
 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import Column, Integer, String

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    disease = Column(String)

class User(Base):
    __tablename__= "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String,default="user")
Base.metadata.create_all(bind=engine)
from security import hash_password

db = SessionLocal()

if not db.query(User).filter(User.username == "exhibition").first():
    exhibition_user = User(
        username="exhibition",
        hashed_password=hash_password("admin"),
        role="admin"
    )

    db.add(exhibition_user)
    db.commit()

db.close()


        
    
        
 

    
    
    
    




 




  

         



       