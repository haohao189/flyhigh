############################# Attention ########################

# The Code in model workers all copied from 
# https://github.com/chatchat-space/Langchain-Chatchat/blob/master/server/model_workers

#################################################################

from .base import *
from .zhipu import ChatGLMWorker
from .minimax import MiniMaxWorker
from .xinghuo import XingHuoWorker
from .qianfan import QianFanWorker
from .fangzhou import FangZhouWorker
from .qwen import QwenWorker
from .baichuan import BaiChuanWorker
from .azure import AzureWorker
from .tiangong import TianGongWorker
from .openai import ExampleWorker


IMPORT_MODEL_WORKERS = [
    ChatGLMWorker, MiniMaxWorker, XingHuoWorker, QianFanWorker, FangZhouWorker,
    QwenWorker, BaiChuanWorker, AzureWorker, TianGongWorker, ExampleWorker
]

MODEL_WORKER_SETS = [tool.__name__ for tool in IMPORT_MODEL_WORKERS]

