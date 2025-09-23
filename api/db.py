from pymongo import AsyncMongoClient
from settings import settings
import boto3
from botocore.config import Config
import redis.asyncio as aioredis
from qstash import AsyncQStash

client = AsyncMongoClient(settings.mongo_uri)
db = client.moick_db


s3 = boto3.client(
    "s3",
    endpoint_url=settings.storage_endpoint_url,
    aws_access_key_id=settings.storage_access_key,
    aws_secret_access_key=settings.storage_secret_key,
    config=Config(signature_version="s3v4"),
)

redis = aioredis.from_url(url=settings.redis_url, decode_responses=True)

qstash = AsyncQStash(settings.qstash_token)
