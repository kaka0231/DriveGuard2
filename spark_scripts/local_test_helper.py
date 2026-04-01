import os
import csv

# 1. 配置路徑
# 請確保你的原始 .txt 文件放在 data/ 目錄下
input_dir = "data/"
output_dir = "data/summary_result"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. 模擬 Spark 的聚合邏輯
summary = {}

print("正在掃描 data/ 目錄下的原始數據文件...")

for filename in os.listdir(input_dir):
    # 修改：只要文件名包含 detail_record 且不是目錄就處理
    file_path = os.path.join(input_dir, filename)
    if os.path.isfile(file_path) and "detail_record" in filename:
        print(f"正在處理原始數據: {filename}")
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
                
                # 統計邏輯 (對應 PDF 中的欄位)
                if row[13] == '1': summary[key]["overspeed_times"] += 1
                if row[16] == '1': summary[key]["fatigue_times"] += 1
                
                try:
                    summary[key]["overspeed_time_seconds"] += int(row[15]) if row[15] else 0
                    summary[key]["neutral_slide_time_seconds"] += int(row[12]) if row[12] else 0
                except:
                    pass

# 3. 保存為網頁需要的 CSV 格式
output_file = os.path.join(output_dir, "part-00000.csv")
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(["driverID", "carPlateNumber", "overspeed_times", "fatigue_times", "overspeed_time_seconds", "neutral_slide_time_seconds"])
    for (d_id, c_plate), data in summary.items():
        writer.writerow([d_id, c_plate, data["overspeed_times"], data["fatigue_times"], data["overspeed_time_seconds"], data["neutral_slide_time_seconds"]])

print(f"測試數據生成成功！請刷新網頁。結果保存在: {output_file}")
