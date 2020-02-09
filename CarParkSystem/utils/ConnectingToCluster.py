import pymongo

my_client = pymongo.MongoClient('mongodb+srv://Admin:admin123@cs1813namedb-maax9.mongodb.net/test?retryWrites=true&w=majority')

try:
    print("MongoDB version is %s" % my_client.server_info()['version'])
except pymongo.errors.OperationFailure as error:
    print(error)
    quit(1)

class Ticket:
    def __init__(self, id, nameOfCustomer, ticketType, ticketPrice, timeStayedHRs, date, inTime, outTime):
        self.id = id;
        self.nameOfCustomer = nameOfCustomer
        self.ticketType = ticketType
        self.ticketPrice = ticketPrice
        self.timeStayedHRs = timeStayedHRs
        self.date = date
        self.inTime = inTime
        self.outTime = outTime


def GetAllItems(Database, Table):
    Collection = Table.find()

    for item in Collection:
        print(item)

def AddItem(Database, Table, ticket):
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
        print("Could not do operation of adding ticket.")


Database = my_client.test
#info = Database.getCollectionInfos()
#Database.showCollections()
TicketTable = Database.TicketsTable
x = TicketTable.count()
#t1 = Ticket(x + 1, "Donald T", "Customer", 3, 1, "02.01.2019", "16:00", "17:00")
#t2 = Ticket(x + 2, "Adam G.", "Customer", 2.5, 3, "05.04.2019", "10:00", "13:00")
#t3 = Ticket(x + 3, "Otis H.", "Customer", 3, 1.5, "19.08.2018", "14:00", "15:30")
#t4 = Ticket(x + 1, "Hillary C.", "Resident", 10, 20, "20.02.2018", "06:00", "16:00")
#AddItem(Database, TicketTable, t1)
#AddItem(Database, TicketTable, t2)
#AddItem(Database, TicketTable, t3)
#AddItem(Database, TicketTable, t4)
GetAllItems(Database, TicketTable)

