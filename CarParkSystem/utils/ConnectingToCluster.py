import pymongo
from datetime import datetime

my_client = pymongo.MongoClient('mongodb+srv://Admin:admin123@cs1813namedb-maax9.mongodb.net/test?retryWrites=true&w=majority')

def TestMongoVersion():
    try:
        print("MongoDB version is %s" % my_client.server_info()['version'])
    except pymongo.errors.OperationFailure as error:
        print(error)
        quit(1)

class Ticket:
    def __init__(self, id, nameOfCustomer, ticketType, ticketPrice, timeStayedHRs, date, inTime, outTime):
        self.id = id
        self.nameOfCustomer = nameOfCustomer
        self.ticketType = ticketType
        self.ticketPrice = ticketPrice
        self.timeStayedHRs = timeStayedHRs
        self.date = date
        self.inTime = inTime
        self.outTime = outTime

class Manager:
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

class Time:
    def __init__(self, hours, minutes, seconds):
        self.hours = hours
        self.minutes = minutes
        self.seconds = seconds
    def __str__(self):
        return str(self.hours) + ":" + str(self.minutes) + ":" + str(self.seconds)
    def GetEndTime(self, hours):
        self.hours += hours
        return self

class HappyHour:
    def __init__(self, id, currHour, currMin, currSec, nrHours):
        self.id = id
        self.currentTime = str(str(currHour) + ":" + str(currMin) + ":" + str(currSec))
        self.nrHours = nrHours
        self.endTime = str(str(currHour + nrHours) + ":" + str(currMin) + ":" + str(currSec))

def ConvertStringToTime(txt):
    h = int(txt[0] + txt[1])
    m = int(txt[3] + txt[4])
    s = int(txt[6] + txt[7])
    time = Time(h, m, s)
    return time

def GetAllItems(Table):
    Collection = Table.find()

    for item in Collection:
        print(item)

def AddTicket(Table, ticket):
    try:
        Table.insert_one({
            "_id": ticket.id,
            "Name_of_Customer": ticket.nameOfCustomer,
            "TicketType": ticket.ticketType,
            "TicketPrice": ticket.ticketPrice,
            "TimeStayedHRs": ticket.timeStayedHRs,
            "Date": ticket.date,
            "InTime": ticket.inTime,
            "OutTime": ticket.outTime
        })
    except NotImplementedError:
        print("Could not do operation of adding new ticket.")

def AddManager(ManagerTable, manager):
    try:
        ManagerTable.insert_one({
            "_id": manager.id,
            "Username": manager.username,
            "Password": manager.password
        })
    except NotImplementedError:
        print("Could not do operation of adding new manager")

def AddHappyHour(HappyHourTable, happyhour):
    try:
        HappyHourTable.insert_one({
            "_id": happyhour.id,
            "BeginTime": happyhour.currentTime,
            "Hours": happyhour.nrHours,
            "EndTime": happyhour.endTime
        })
    except NotImplementedError:
        print("Could not do operation of adding new happy hour")

def DeleteManager(ManagerTable, username):
    try:
        query = { "Username": username }
        ManagerTable.delete_many(query)
    except NotImplementedError:
        print("Could not do operation of deleting manager")

Database = my_client.test
TicketTable = Database.TicketsTable
ManagerTable = Database.ManagerTable
HappyhourTable = Database.HappyHourTable
#x = ManagerTable.count()
#m1 = Manager(x + 1, "Stefan", "stefan12345")
#m2 = Manager(x + 2, "Neka", "neka12345")
#m3 = Manager(x + 3, "Keiru", "keiru12345")
#m4 = Manager(x + 4, "Velitta", "velitta12345")
#AddManager(ManagerTable, m1)

#x = HappyhourTable.count()
#currTime = ConvertStringToTime(datetime.now().strftime("%H:%M:%S"))
#hh1 = HappyHour(x + 1, currTime.hours, currTime.minutes, currTime.seconds, 4)
#AddHappyHour(HappyhourTable, hh1)
#GetAllItems(HappyhourTable)
#print(Database.list_collection_names())
#DeleteManager(ManagerTable, "Dave123")
GetAllItems(ManagerTable)

