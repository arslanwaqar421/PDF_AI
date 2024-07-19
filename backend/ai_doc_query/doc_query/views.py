from django.http import JsonResponse,HttpResponse
from .models import *
import json
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .jwt_utils import *
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os,io
from .bot_utils import *
from PyPDF2 import PdfReader

knowldgeBase = None

@method_decorator(csrf_exempt, name='dispatch')
class UserApis(View):
    #this api is not used primarily but its funcitonal and work can be tested on postman
    def get(self,request,id=None):
        if id:
            try:
                user = User.objects.get(pk=id)
                user_data = {
                    "id": str(user.id),
                    "email": user.email,
                    "password": user.password
                }
                return JsonResponse(user_data, status=200)
            except DoesNotExist:
                return JsonResponse({"message": "User does not exist"}, status=404)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        else:
            try:
                users_list = []

                for user in User.objects:
                    user_data = {
                        "id": str(user.id),
                        "email": user.email,
                        "password": user.password
                    }
                    users_list.append(user_data)

                return JsonResponse(users_list, safe=False, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)

    def post(self,request):
        try:
            # api accepts the form data so on postman the email and passwords are shown empty
            email = request.POST.get('email')
            password = request.POST.get('password')
            # check if the email and passwords are provided in payload
            if not email or not password:
                return JsonResponse({"message": "Email and Password are required."}, status=400)
            # dont let the  user make an account if the use with this email already exists
            if User.objects(email=email).first():
                return JsonResponse({"message": "User with this email already exists"}, status=400)

            token, exp_time = generate_jwt(email)

            new_user = User(email=email, password=password, auth_token = token)
            new_user.save()
            # returns the user document if the user creation is successfull
            return JsonResponse({"id": str(new_user.id),"email": email, "password": password, "auth_token" : token}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

    def put(self,request,id):
        try:
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]

            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message" : response.get('msg')}, status = 401)

            data = json.loads(request.body)
            password = data.get('password')

            if not password:
                return JsonResponse({"message": "New password required"}, status=400)

            try:
                req_user = User.objects.get(pk=id)
            except DoesNotExist:
                return JsonResponse({"message": "User does not exist"}, status=404)

            req_user.password = password
            req_user.save()
            return JsonResponse({"message": "Password updated"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)
        
    def delete(self,request,id): # not wrapped yet with JWT tokens because not used primarily
        try:
            try:
                req_user = User.objects.get(pk=id)
            except User.DoesNotExist:
                return JsonResponse({"message": "User does not exist"}, status=404)

            req_user.delete()
            return JsonResponse({"message": "The user was deleted"}, status=204)

        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ChatApis(View):
    # get chats for specific user or get a specific chat
    def get(self,request, id=None):
        # check the header for the authorization token 
        headers = request.headers
        auth_header = headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

        token = auth_header.split(" ")[1]
        # verify the authorization token
        response = verify_jwt(token)
        if response.get('status') == False:
            return JsonResponse({"message" : response.get('msg')}, status = 401)
        if id:
            try:
                chat = Chat.objects.get(pk=id)
                chat_data= {
                    "id": str(chat.id),
                    "title" : chat.title,
                    "creation_timestamp": chat.creation_timestamp,
                    "owner" : chat.owner.email
                }
                return JsonResponse(chat_data, status = 200)
            except Exception as e:
                return JsonResponse({"message" : str(e)}, status = 500)
        else:
            try:
                # fetching the chats of a specific
                decoded = response.get('msg')
                user_email = decoded.get("email")
                chat_list = []
                for chat in Chat.objects:
                    if chat.owner.email == user_email: 
                        chat_data= {
                        "id": str(chat.id),
                        "title" : chat.title,
                        "creation_timestamp": chat.creation_timestamp,
                        "owner" : chat.owner.email
                        }
                        chat_list.append(chat_data)
                chat_list.reverse() # reverse the list of the chats so the latest one appears at the top
                return JsonResponse(chat_list,safe=False,status = 200)
            except Exception as e:
                return JsonResponse({"message" : str(e)}, status = 500)
            
    # create a new chat api
    def post(self,request):
        try:
            # check the header for the authorization token 
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]
            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message" : response.get('msg')}, status = 401)

            data = json.loads(request.body)
            title = data.get("title")
            owner_id = data.get("owner_id")

            if not title or not owner_id:
                return JsonResponse({"message" : "Chat title and owner_id required"}, status = 400)

            new_chat = Chat(title = title , owner = owner_id)
            new_chat.save()
            # send the newly created chat to frontend
            return JsonResponse({"id" : str(new_chat.id),
                                 "creation_timestamp" : new_chat.creation_timestamp,
                                 "owner" : str(new_chat.owner.id),
                                 "title" : new_chat.title},status = 201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"message" : str(e)}, status =500)

    # update chat title but its not used primarily at frontend but can be tested through postman
    def put(self,request,id):
        try:
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]
            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message" : response.get('msg')}, status = 401)

            data = json.loads(request.body)
            title = data.get("title")

            if not title:
                return JsonResponse({"message" : "Title is required"}, status= 400)

            try:
                req_chat = Chat.objects.get(pk=id)
                req_chat.title = title
                req_chat.save()
                return JsonResponse({"message": "Title updated"}, status=200)

            except json.JSONDecodeError:
                return JsonResponse({"message": "Invalid JSON"}, status=400)
            except DoesNotExist:
                return JsonResponse({"message" : "Chat does not exist"}, status = 404)

        except Exception as e:
            return JsonResponse({"message" : str(e)}, status = 500)

    # delete a specific chat based on id
    def delete(self, request, id):
        try:
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]
            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message" : response.get('msg')}, status = 401)
            try:
                req_chat = Chat.objects.get(pk=id)
            except DoesNotExist:
                return JsonResponse({"message": "Chat does not exist"}, status=404)

            req_chat.delete()
            return JsonResponse({"message" : "Chat deleted succesfully"}, status=200)
        except Exception as e:
            return JsonResponse({"message" : str(e)},status=500)


@method_decorator(csrf_exempt, name="dispatch")
class MessageApis(View):
    # get messages of a specific chat
    def get(self, request, id):
        headers = request.headers
        auth_header = headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

        token = auth_header.split(" ")[1]
        response = verify_jwt(token)

        if response.get('status') == False:
            return JsonResponse({"message" : response.get('msg')}, status = 401)

        if id:
            try:
                chat_messages =[]
                for msg in Message.objects:
                    # find the messages against the chat id got from the front end
                    if str(msg.chat.id) == id:
                        curr_msg = {
                            "id" : str(msg.id),
                            "chat": msg.chat.title,
                            "type": str(msg.type),
                            "msg_txt": str(msg.msg_txt),
                            "creation_timestamp": msg.creation_timestamp
                        }
                        chat_messages.append(curr_msg)

                return JsonResponse(chat_messages,safe=False ,status = 200)
            except DoesNotExist:
                return JsonResponse({"message" : "No message found for the Chat"}, status = 404)
            except Exception as e:
                return JsonResponse({"message" : str(e)}, status= 500)
        else:
            return JsonResponse({"message" : "Chat id not found in query param"},status =400)

    # create a new message bot/user
    def post(self, request):
        try:
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]
            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message" : response.get('msg')}, status = 401)

            data = json.loads(request.body)

            msg_txt = data.get("msg_txt")
            type = data.get("type")
            chat_id = data.get("chat_id")

            if not msg_txt or not type or not chat_id:
                return JsonResponse({"message": "Message text , type and chat are required"}, status =400)

            # check the message type and set the enumeration type accordingly
            if type == "bot":
                type = MessageType.BOT
            elif type == "user":
                type = MessageType.USER
            else:
                return JsonResponse({"message":"Message type can either be 'user' or 'bot' "},status= 400)

            new_msg = Message(msg_txt=msg_txt , type=type , chat=chat_id)
            new_msg.save()
            return JsonResponse({"id" : str(new_msg.id),
                                 "msg_txt" : new_msg.msg_txt,
                                 "creation_timestamp" : new_msg.creation_timestamp},status = 201)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status= 500)

    

@method_decorator(csrf_exempt, name="dispatch")
class FileApis(View):
    # get the files uploaded for a specific chat
    def get(self,request,id):
        headers = request.headers
        auth_header = headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

        token = auth_header.split(" ")[1]
        response = verify_jwt(token)

        if response.get('status') == False:
            return JsonResponse({"message" : response.get('msg')}, status = 401)

        if id:
            try:
                file_list = []
                text = ""
                for file in File.objects:
                    if str(file.chat.id) == id:
                        file_obj = {
                        "id": str(file.id),
                        "name": file.name,
                        "chat": file.chat.title
                        }

                        with open(f"uploads/{file.name}", "rb") as f:
                           pdf =  PdfReader(f)
                           for page in pdf.pages:
                               text += page.extract_text()
                        file_list.append(file_obj)
                        global knowldgeBase
                        knowldgeBase = process_text(text)
                return JsonResponse(file_list,safe=False,status=200)
            except Exception as e:
                print("Exception : ", e)
                return JsonResponse({"message" : str(e)}, status = 500)
        else:
            return JsonResponse({"message" : "Chat id not found in query param"}, status = 400)

    # save the selected files to the server side and database
    def post(self, request):
        try:
            headers = request.headers
            auth_header = headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token not supplied or improperly formatted"}, status=401)

            token = auth_header.split(" ")[1]
            response = verify_jwt(token)

            if response.get('status') == False:
                return JsonResponse({"message": response.get('msg')}, status=401)
            chat_id = request.POST.get("chat_id") 

            if not chat_id:
                return JsonResponse({"message": "Chat ID is required"}, status=400)

            if 'files[]' not in request.FILES:
                return JsonResponse({"message": "No file uploaded"}, status=400)
            text = ""
            uploaded_files = request.FILES.getlist('files[]')
            for uploaded_file in uploaded_files:
                file_name = uploaded_file.name
                file_path = default_storage.save(os.path.join('uploads', file_name), ContentFile(uploaded_file.read()))
                new_file = File(name=file_name, chat=chat_id)
                with open(file_path, "rb") as f:
                    new_file.file.put(f, content_type = "application/pdf")
                    pdf_file = PdfReader(f)
                    for page in pdf_file.pages:
                        text += page.extract_text()

                new_file.save()
            global knowledgeBase
            knowledgeBase = process_text(text)

            return JsonResponse({"message": "Files uploaded successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

    # delete a file from the database only can be tested on postman
    def delete(self,request,id):
        try:
            req_file = File.objects.get(pk=id)
            req_file.file.delete()
            req_file.save()
            req_file.delete()
            return  JsonResponse({"message": "File deleted successfully"} , status=204)
        except DoesNotExist as d:
            return JsonResponse({"message": "File does not exist"}, status = 404)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status = 500)

@method_decorator(csrf_exempt, name="dispatch")
# login api that denies login if the JWT token expires
class Login(View):
    def post(self,request):
        try:
            email = request.POST.get('email')
            password = request.POST.get('password')
            user = User.objects(email=email).first()
            if user:
                if user.password == password:
                    verified = verify_jwt(str(user.auth_token))
                    if verified.get('status'):
                        return JsonResponse({"id": str(user.id),"email": user.email, "password": user.password, "auth_token" : user.auth_token},status=200)
                    else:
                        return JsonResponse({"message" : verified.get('msg')},status = 400)
                else:
                    return JsonResponse({"message" : "Incorrect Password"},status = 400)
            else:
                return JsonResponse({"message": "Incorrect Email"}, status= 400)
        except Exception as e:
            return JsonResponse({"message" : str(e)}, status=500)

@method_decorator(csrf_exempt, name="dispatch")
class BotApis(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            user_query = data.get('user_query')
            chat_id = data.get("chat_id")
            global knowldgeBase
            print(knowldgeBase)
            response = bot_response(knowledgeBase,user_query)
            new_msg = Message(msg_txt = response, type=MessageType.BOT, chat=chat_id)
            new_msg.save()
            return JsonResponse({"message" : response} , status= 200)
        except Exception as e:
            print(e)
            return JsonResponse({"message": str(e)}, status=500)
