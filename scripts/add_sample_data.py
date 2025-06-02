import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.driving_school_platform

async def add_sample_data():
    """Add sample driving schools and managers to the database"""
    
    # Sample driving schools data
    sample_schools = [
        {
            "id": str(uuid.uuid4()),
            "name": "École de Conduite El-Khalil",
            "address": "15 Rue Didouche Mourad, Centre-ville",
            "state": "Alger",
            "phone": "+213-21-635-789",
            "email": "contact@elkhalil-driving.dz",
            "description": "École de conduite réputée avec 20 ans d'expérience. Nous offrons des cours théoriques et pratiques avec des instructeurs certifiés.",
            "price": 28000.0,
            "latitude": 36.7538,
            "longitude": 3.0588,
            "logo_url": None,
            "photos": [],
            "rating": 4.7,
            "total_reviews": 89,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Auto-École Moderne",
            "address": "Boulevard de l'ALN, Hai Es-Salem",
            "state": "Oran",
            "phone": "+213-41-456-123",
            "email": "info@autoecole-moderne.dz",
            "description": "Formation moderne avec simulateurs de conduite et cours en ligne. Spécialisés dans la formation rapide et efficace.",
            "price": 25000.0,
            "latitude": 35.6911,
            "longitude": -0.6417,
            "logo_url": None,
            "photos": [],
            "rating": 4.5,
            "total_reviews": 156,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "École de Conduite Sétif Plus",
            "address": "Cité 1000 Logements, Sétif",
            "state": "Sétif",
            "phone": "+213-36-789-456",
            "email": "setifplus@gmail.com",
            "description": "École familiale avec approche personnalisée. Instructeurs patients et méthodes pédagogiques adaptées à chaque élève.",
            "price": 22000.0,
            "latitude": 36.1833,
            "longitude": 5.4167,
            "logo_url": None,
            "photos": [],
            "rating": 4.8,
            "total_reviews": 67,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Conduite Express Constantine",
            "address": "Rue Larbi Ben M'hidi, Constantine",
            "state": "Constantine",
            "phone": "+213-31-654-987",
            "email": "contact@conduite-express.dz",
            "description": "Formation accélérée avec garantie de réussite. Nos élèves obtiennent leur permis en moyenne en 3 mois.",
            "price": 30000.0,
            "latitude": 36.3650,
            "longitude": 6.6147,
            "logo_url": None,
            "photos": [],
            "rating": 4.3,
            "total_reviews": 124,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Auto-École Sahara",
            "address": "Avenue de l'Indépendance, Ouargla",
            "state": "Ouargla",
            "phone": "+213-29-321-654",
            "email": "sahara.driving@gmail.com",
            "description": "Seule école de conduite moderne dans la région. Formation complète avec véhicules récents et instructeurs expérimentés.",
            "price": 20000.0,
            "latitude": 31.9539,
            "longitude": 5.3981,
            "logo_url": None,
            "photos": [],
            "rating": 4.6,
            "total_reviews": 43,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "École de Conduite El-Badr",
            "address": "Cité 20 Août, Skikda",
            "state": "Skikda",
            "phone": "+213-38-987-321",
            "email": "elbadr.conduite@outlook.com",
            "description": "École réputée avec instructrices qualifiées pour les cours femmes. Ambiance familiale et résultats garantis.",
            "price": 24000.0,
            "latitude": 36.8761,
            "longitude": 6.9094,
            "logo_url": None,
            "photos": [],
            "rating": 4.9,
            "total_reviews": 78,
            "manager_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow()
        }
    ]
    
    try:
        # Check if schools already exist
        existing_count = await db.driving_schools.count_documents({})
        
        if existing_count == 0:
            # Insert sample schools
            result = await db.driving_schools.insert_many(sample_schools)
            print(f"✅ Inserted {len(result.inserted_ids)} sample driving schools")
            
            # List the schools we added
            for school in sample_schools:
                print(f"   📍 {school['name']} in {school['state']} - {school['price']:,.0f} DZD")
        else:
            print(f"ℹ️  Database already has {existing_count} schools. Not adding samples.")
            
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")

async def main():
    print("🏫 Adding sample driving schools to database...")
    await add_sample_data()
    print("🎉 Sample data setup complete!")

if __name__ == "__main__":
    asyncio.run(main())