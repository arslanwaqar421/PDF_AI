# SMART DOC QUERY

An application that assists user upload multiple files and take assistance from chatbot to get answers of their questions regarding uploaded files.

## Features
### Backend
1. Implemented RESTful apis for Login/Signup
2. Implemented RESTful apis for CRUD operations on Chats
3. Implemeted RESTful apis for create,delete,read operations on Files
5. Implemented RESTful apis for create operation on messages.
6. Integerated JWT varification for user authentication and authorization
7. Integrated OpenAI to provide assistance by generating answers to user questions from uploaded files.
8. Utilizes LangChain for efficient language processing tasks and text management.

## Technologies Used
1. Django 4.2.13 (Backend)
2. React 18.3.1 (Frontend)
3. MongoDB (Database)

## Pre-requisits
1. Django 4.2.13
2. Node.js 20.15.0
3. npm 10.7.0
4. Python 3.8.10


## Installation 
### Backend Setup:

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install packages.

Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) 

#### Create a vitual environment

```bash
python -m venv venv
```
#### Activate the virtual environment (Linux)
```bash
source venv/bin/activate
```

#### Install project dependencies
```bash
pip install -r requirements.txt
```
#### Make migrations for Django
```bash
python manage.py makemigrations
python manage.py migrate
```
#### Configure OpenAI API Integration
```bash
Get OpenAI API Key: Obtain your OpenAI API key from the OpenAI platform.
Set API Key: Store your OpenAI API key securely. You can set it as an environment variable or directly in your Django settings (not recommended for production).
Add OpenAI API key into this ENV: OPEN_AI_API_KEY
```
#### Go to the project directory and run server
```bash
python 