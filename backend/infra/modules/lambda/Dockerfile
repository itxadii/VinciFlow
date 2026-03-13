FROM public.ecr.aws/lambda/python:3.12

# 📂 Copy dependencies
COPY backend/src/requirements.txt .
RUN pip install -r requirements.txt

# 📂 Copy all refactored logic files
COPY backend/src/api_handler.py .
COPY backend/src/pipeline_handler.py .
COPY backend/src/publish_handler.py .
COPY backend/src/utils.py .

# Default entrypoint (Terraform will override this for each function)
CMD [ "api_handler.handler" ]