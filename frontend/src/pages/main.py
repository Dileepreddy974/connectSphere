import json
from datetime import datetime

def convertFormatOne(jsonObject):
    location = jsonObject["location"].split("/")

    return {
        "deviceID": jsonObject["deviceID"],
        "deviceType": jsonObject["deviceType"],
        "timestamp": jsonObject["timestamp"],
        "location": {
            "country": location[0],
            "city": location[1],
            "area": location[2],
            "factory": location[3],
            "section": location[4]
        },
        "data": {
            "status": jsonObject["operationStatus"],
            "temperature": jsonObject["temp"]
        }
    }

def convertFormatTwo(jsonObject):
    timestamp = int(
        datetime.fromisoformat(
            jsonObject["timestamp"].replace("Z", "+00:00")
        ).timestamp() * 1000
    )

    return {
        "deviceID": jsonObject["device"]["id"],
        "deviceType": jsonObject["device"]["type"],
        "timestamp": timestamp,
        "location": {
            "country": jsonObject["country"],
            "city": jsonObject["city"],
            "area": jsonObject["area"],
            "factory": jsonObject["factory"],
            "section": jsonObject["section"]
        },
        "data": {
            "status": jsonObject["data"]["status"],
            "temperature": jsonObject["data"]["temperature"]
        }
    }