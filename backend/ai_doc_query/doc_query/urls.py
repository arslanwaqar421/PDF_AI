from django.urls import path

from .import views

urlpatterns = [
    path("user/" , views.UserApis.as_view(), name="create_get_user"),
    path("user/<str:id>" , views.UserApis.as_view(), name="delete_update_user"),
    path("user/login/", views.Login.as_view(), name = "login"),
    path("chat/", views.ChatApis.as_view(), name= "create_get_chat"),
    path("chat/<str:id>", views.ChatApis.as_view(), name= "update_delete_chat"),
    path("chat/<str:id>/messages",views.MessageApis.as_view(), name="get_chat_messages"),
    path("chat/<str:id>/files", views.FileApis.as_view()),
    path("message/", views.MessageApis.as_view(), name="create_get_message"),
    path("message/<str:id>", views.MessageApis.as_view(),name="update_delete_message"),
    path("file/", views.FileApis.as_view(), name="create_get_file"),
    path("file/<str:id>", views.FileApis.as_view(), name="updated_delete_file"),
    path("chat/message/bot", views.BotApis.as_view(), name="bot_response")
]