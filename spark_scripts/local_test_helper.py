import os
import csv

# 1. 配置路徑
input_dir = "data"
output_dir = os.path.join("data", "summary_result")

print(f"--- 診斷開始 ---")
print(f"當前工作目錄: {os.getcwd()}")

# 檢查 data 目錄
if not os.path.exists(input_dir):
    print(f"錯誤：找不到 '{input_dir}' 目錄！正在為你創建...")
    os.makedirs(input_dir)
else:
    print(f"找到 '{input_dir}' 目錄。")
    files = os.listdir(input_dir)
    print(f"目錄下的文件有: {files}")

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. 模擬 Spark 的聚合邏輯
summary = {}
processed_count = 0

print(f"正在掃描 '{input_dir}' 中的原始數據...")

for filename in os.listdir(input_dir):
    file_path = os.path.join(input_dir, filename)
    # 只要文件名包含 detail_record 且不是目錄就處理
    if os.path.isfile(file_path) and "detail_record" in filename:
        print(f">>> 正在處理: {filename}")
        processed_count += 1
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) < 19: continue
                    
                    driver_id = row[0]
                    car_plate = row[1]
                    key = (driver_id, car_plate)
                    
                    if key not in summary:
                        summary[key] = {
                            "overspeed_times": 0,
                            "fatigue_times": 0,
                            "overspeed_time_seconds": 0,
                            "neutral_slide_time_seconds": 0
                        }
                    
                    if row[13] == '1': summary[key]["overspeed_times"] += 1
                    if row[16] == '1': summary[key]["fatigue_times"] += 1
                    
                    try:
                        summary[key]["overspeed_time_seconds"] += int(row[15]) if row[15] else 0
                        summary[key]["neutral_slide_time_seconds"] += int(row[12]) if row[12] else 0
                    except:
                        pass
        except Exception as e:
            print(f"讀取文件 {filename} 時出錯: {e}")

if processed_count == 0:
    print("!!! 警告：沒有找到任何包含 'detail_record' 的文件。請檢查文件名。")
    print("提示：你的文件名應該像 'detail_record_2017_01_02_08_00_00'")
else:
    # 3. 保存結果
    output_file = os.path.join(output_dir, "part-00000.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["driverID", "carPlateNumber", "overspeed_times", "fatigue_times", "overspeed_time_seconds", "neutral_slide_time_seconds"])
        for (d_id, c_plate), data in summary.items():
            writer.writerow([d_id, c_plate, data["overspeed_times"], data["fatigue_times"], data["overspeed_time_seconds"], data["neutral_slide_time_seconds"]])

    print(f"--- 處理完成 ---")
    print(f"共處理了 {processed_count} 個原始文件。")
    print(f"結果已保存至: {output_file}")
