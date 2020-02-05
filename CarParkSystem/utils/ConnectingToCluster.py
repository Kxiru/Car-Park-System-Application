import pymongo
import datetime

my_client = pymongo.MongoClient("mongodb+srv://Admin:admin123@cs1813namedb-maax9.mongodb.net/test?retryWrites=true&w=majority"
)

try:
    print("MongoDB version is %s" % my_client.server_info()['version'])
except pymongo.errors.OperationFailure as error:
    print(error)
    quit(1)

my_database = my_client.CarParkDatabase
my_collection = my_database.TicketsTable

records = my_collection.find()
for item in records:
    print(item)


#////////////////////////////
# This segment of code refers to how to query data from the database.
# my_cursor = my_collection.find()

# for item in my_cursor:
#     print(item["name"])

#////////////////////////////
# How to insert into the database. You will get an error if you insert records with pre-existing IDs (OR other fields)
# my_collection.insert_many([
#     {
#         "_id": 1,
#         "name": "Bill W",
#         "ticketPrice": 3.20,
#         "timeStayedHRs": 4,
#         "Date": datetime.datetime.utcnow(),
#     },{
#         "_id": 2,
#         "name": "Jen C",
#         "ticketPrice": 3.20,
#         "timeStayedHRs": 3,
#         "Date": datetime.datetime(2020,2,4),
#     },{
#         "_id": 3,
#         "name": "Karl J",
#         "ticketPrice": 3.20,
#         "timeStayedHRs": 4,
#         "Date": datetime.datetime(2020,2,5),
#     }
# ])


