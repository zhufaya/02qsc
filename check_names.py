import socket
import json

HOST = "192.168.10.68"
PORT = 1710

print(f"正在连接 Q-SYS ({HOST}:{PORT})...")
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((HOST, PORT))
    
    # 给我们的查询指令打上特定的标签 id: "my_query"
    req = {
        "jsonrpc": "2.0",
        "id": "my_query",
        "method": "Component.GetControls",
        "params": {"Name": "Custom_Controls"}
    }
    s.send((json.dumps(req) + '\0').encode('utf-8'))
    
    print("指令已发送，正在接收并过滤底层消息...")
    
    # 循环接收，无视心跳广播，直到找到带有 "my_query" 标签的回复
    while True:
        data = s.recv(8192).decode('utf-8', errors='ignore')
        messages = data.split('\0')
        for m in messages:
            m = m.strip()
            if not m: continue
            
            try:
                response = json.loads(m)
                # 只有匹配到我们发送的 id 时，才打印结果
                if response.get("id") == "my_query":
                    print("\n🎉 成功获取 Custom_Controls 的真实控件信息！\n")
                    if "result" in response:
                        controls = response["result"].get("Controls", [])
                        for ctrl in controls:
                            print(f"👉 发现控件真实名称: '{ctrl.get('Name')}'")
                        print("\n请把上面这几个名字复制到前端代码里！")
                    else:
                        print("❌ 没找到控件，请确保 Script Access Name 是 Custom_Controls 并已按 F5 运行:", response)
                    
                    s.close()
                    exit()
            except json.JSONDecodeError:
                pass
except Exception as e:
    print("❌ 发生错误:", e)