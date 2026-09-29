from fastapi import FastAPI
from fastapi import Depends,HTTPException
 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, get_db, User
from security import hash_password, verify_password, create_access_token

import os 





app = FastAPI(title="Smart Hospital Management System")

# Enable CORS for frontend browser integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

patients = []

# Home
@app.get("/")
def home():
    return {"message": "Smart Hospital Management Backend is running"}

# GET - All patients
@app.get("/patients")
def get_patients():
    return {"patients": patients}

# POST - Add patient
@app.post("/patients")
def add_patient(name: str, age: int, disease: str):
    patient = {
        "id": len(patients) + 1,
        "name": name,
        "age": age,
        "disease": disease
    }

    patients.append(patient)

    return {
        "message": "Patient added successfully",
        "patient": patient
    }
# DELETE - Delete patient
@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int):
    for patient in patients:
        if patient["id"] == patient_id:
            patients.remove(patient)
            return {"message": "Patient deleted successfully"}

    return {"message": "Patient not found"}
# UPDATE - Update patient
@app.put("/patients/{patient_id}")
def update_patient(patient_id: int, name: str, age: int, disease: str):
    for patient in patients:
        if patient["id"] == patient_id:
            patient["name"] = name
            patient["age"] = age
            patient["disease"] = disease

            return {
                "message": "Patient updated successfully",
                "patient": patient
            }

    return {"message": "Patient not found"}
# GET - Get single patient
@app.get("/patients/{patient_id}")
def get_patient(patient_id: int):
    for patient in patients:
        if patient["id"] == patient_id:
            return patient

    return {"message": "Patient not found"}





# yahin Doctor ka data add karo
doctors = [
    {
        "id": 1,
        "name": "Dr. Sharma",
        "specialization": "Cardiologist"
    },
    {
        "id": 2,
        "name": "Dr. Verma",
        "specialization": "Neurologist"
    }
]
# GET - Get all doctors
@app.get("/doctors")
def get_doctors():
    return {"doctors": doctors}
# POST - Add Doctor

@app.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: int):
    for doctor in doctors:
        if doctor["id"] == doctor_id:
            return doctor

    return {"message": "Doctor not found"}
# DELETE - Delete doctor
@app.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int):
    for doctor in doctors:
        if doctor["id"] == doctor_id:
            doctors.remove(doctor)
            return {"message": "Doctor deleted successfully"}

    return {"message": "Doctor not found"}

# UPDATE - Update doctor
@app.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, name: str, specialization: str):
    for doctor in doctors:
        if doctor["id"] == doctor_id:
            doctor["name"] = name
            doctor["specialization"] = specialization
@app .post("/doctor")            
def add_doctor(name: str,
specialization: str):
    new_id = len(doctors) + 1

    doctor = {
        "id": new_id,
        "name": name,
        "specialization": specialization
    }

    doctors.append(doctor)

    return {
        "message": "Doctor added successfully",
        "doctor": doctor
    }
#GET-Get single doctor

@app.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: int):
    for doctor in doctors:
        if doctor["id"] == doctor_id:
            return doctor

    return {"message": "Doctor not found"}


# Appointment data
appointments = []   




# POST - Create Appointment
@app.post("/appointments")
async def create_appointment(patient_id: int, doctor_id: int, date: str, time: str):
    appointment = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "time": time
    }

    appointments.append(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": appointment
    }
# POST - Create Appointment
@app.post("/appointments")
async def create_appointment(patient_id: int, doctor_id: int, date: str, time: str):
    appointment = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "time": time
    }

    appointments.append(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": appointment
    }


# Appointment data
appointments = []

# POST - Create Appointment
@app.post("/appointments")
def create_appointment(patient_id: int, doctor_id: int, date: str, time: str):
    appointment = {
        "id": len(appointments) + 1,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "time": time
    }

    appointments.append(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": appointment
    }# Appointment data
appointments = []

# POST - Create Appointment
@app.post("/appointments")
def create_appointment(patient_id: int, doctor_id: int, date: str, time: str):
    appointment = {
        "id": len(appointments) + 1,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "time": time
    }

    appointments.append(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": appointment
    }
# GET - All Appointments
@app.get("/appointments")
def get_appointments():
    return {"appointments": appointments}
#POST - Create Appointment            
@app.post("/appointments")
def create_appointment(patient_id: int, doctor_id: int, date: str, time: str):
    appointment = {
        "id": len(appointments) + 1,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "time": time
    }

    appointments.append(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": appointment
    }
# GET - Get single appointment
@app.get("/appointments/{appointment_id}")
def get_appointment(appointment_id: int):
    for appointment in appointments:
        if appointment["id"] == appointment_id:
            return appointment

    return {"message": "Appointment not found"}
# UPDATE - Update appointment
@app.put("/appointments/{appointment_id}")
def update_appointment(appointment_id: int, patient_id: int, doctor_id: int, date: str, time: str):
    for appointment in appointments:
        if appointment["id"] == appointment_id:
            appointment["patient_id"] = patient_id
            appointment["doctor_id"] = doctor_id
            appointment["date"] = date
            appointment["time"] = time

            return {
                "message": "Appointment updated successfully",
                "appointment": appointment
            }

    return {"message": "Appointment not found"}
# DELETE - Delete Appointment
@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    for appointment in appointments:
        if appointment["id"] == appointment_id:
            appointments.remove(appointment)
            return {"message": "Appointment deleted successfully"}

    return {"message": "Appointment not found"}
# Medical Records data
medical_records = []

# POST - Create Medical Record
@app.post("/medical-records")
def create_medical_record(
    patient_id: int,
    doctor_id: int,
    diagnosis: str,
    symptoms: str,
    prescription: str,
    date: str
):
    record = {
        "id": len(medical_records) + 1,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "diagnosis": diagnosis,
        "symptoms": symptoms,
        "prescription": prescription,
        "date": date
    }

    medical_records.append(record)

    return {
        "message": "Medical record created successfully",
        "record": record
    }
# GET - All Medical Records
@app.get("/medical-records")
def get_medical_records():
    return {"medical_records": medical_records}
# GET - Get single medical record
@app.get("/medical-records/{record_id}")
def get_medical_record(record_id: int):
    for record in medical_records:
        if record["id"] == record_id:
            return record

    return {"message": "Medical record not found"}
# UPDATE - Update Medical Record
@app.put("/medical-records/{record_id}")
def update_medical_record(
    record_id: int,
    patient_id: int,
    doctor_id: int,
    diagnosis: str,
    symptoms: str,
    prescription: str,
    date: str
):
    for record in medical_records:
        if record["id"] == record_id:
            record["patient_id"] = patient_id
            record["doctor_id"] = doctor_id
            record["diagnosis"] = diagnosis
            record["symptoms"] = symptoms
            record["prescription"] = prescription
            record["date"] = date

            return {
                "message": "Medical record updated successfully",
                "record": record
            }

    return {"message": "Medical record not found"}

# DELETE - Delete Medical Record
@app.delete("/medical-records/{record_id}")
def delete_medical_record(record_id: int):
    for record in medical_records:
        if record["id"] == record_id:
            medical_records.remove(record)
            return {"message": "Medical record deleted successfully"}

    return {"message": "Medical record not found"}