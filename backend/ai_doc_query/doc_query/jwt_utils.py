import jwt
import datetime
import time


key = "arslanwaqar421"
algorithm = "HS256"

def generate_jwt(email):
    payload = {
        "email" : email,
        "exp" : datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(days=5)
    }
    encoded = jwt.encode(payload, key, algorithm)
    print(encoded)
    print(datetime.datetime.now(tz=datetime.timezone.utc))
    return (encoded,payload['exp'])


def verify_jwt(token):
    try:
        print(datetime.datetime.now(tz=datetime.timezone.utc))
        decoded = jwt.decode(token, key, algorithm)
        return {"status" : True,
                "msg" : decoded}
    except jwt.ExpiredSignatureError as e:
        print(e)
        return {"status" : False,
                "msg" : str(e)}
    except jwt.InvalidTokenError as e:
        print(e)
        return {"status" : False,
                "msg" : str(e)}
