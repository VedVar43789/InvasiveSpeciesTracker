# '''
# DB index creation
# '''

# from motor.motor_asyncio import AsyncIOMotorDatabase
# from pymongo import ASCENDING, DESCENDING

# async def ensure_indexes(db: AsyncIOMotorDatabase):
#     '''
#     Create required MongoDB indexes.
#     Safe to run multiple times (MongoDB will skip if index already exists).
#     '''
    
    # tbd
    # await db["species"].create_index([("name", ASCENDING)], unique=True)
    # await db["species"].create_index([("scientific_name", ASCENDING)], unique=True)
    # await db["species"].create_index([("common_name", ASCENDING)], unique=True)
    # await db["species"].create_index([("category", ASCENDING)])
    # await db["species"].create_index([("order", ASCENDING)])
    # await db["species"].create_index([("family", ASCENDING)], unique=True)
    # await db["species"].create_index([("genus", ASCENDING)], unique=True)
    # await db["species"].create_index([("species", ASCENDING)], unique=True)