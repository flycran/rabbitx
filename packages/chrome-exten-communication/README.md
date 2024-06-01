# Chrome Exten Communication

## 1. 概述

在 Chrome 开展程序中，存在多个互相隔离的进程，不同的进程之间传递消息使用的API都是不一样的。
如果需要跨多个进程传递消息，将会非常麻烦。
因此`Chrome Exten Communication`将提供一个统一的通信机制，使得不同进程之间可以使用同一个规范互相传递消息。

每个进程将使用不同的核心包，但都遵循``