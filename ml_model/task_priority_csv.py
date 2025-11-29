import sys
import csv
from datetime import datetime

class TaskPriorityModel:
    def calculate_days_until_due(self, due_date_str):
        try:
            if 'T' in due_date_str:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', ''))
            else:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
            today = datetime.now()
            delta = due_date - today
            return max(0, delta.days)
        except Exception:
            return 7

    def predict_priority(self, task):
        days_until_due = self.calculate_days_until_due(task['due_date'])
        difficulty = int(task['default_difficulty'])
        weight = int(task['default_weight'])
        # Make urgency (deadline) the dominant factor
        urgency_score = max(0, 30 - days_until_due) * 50
        difficulty_score = difficulty * 1
        weight_score = weight * 1
        return urgency_score + difficulty_score + weight_score

    def predict_batch(self, tasks):
        raw_scores = [self.predict_priority(task) for task in tasks]
        total = sum(raw_scores)
        if total > 0:
            normalized = [round(score / total * 100, 2) for score in raw_scores]
        else:
            normalized = [0 for _ in raw_scores]
        return normalized

def main():
    if len(sys.argv) < 3:
        print('Usage: python task_priority_csv.py input.csv output.csv')
        sys.exit(1)
    input_csv = sys.argv[1]
    output_csv = sys.argv[2]
    tasks = []
    with open(input_csv, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            tasks.append(row)
    model = TaskPriorityModel()
    priorities = model.predict_batch(tasks)
    # Write output CSV with id,priority_score
    with open(output_csv, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'priority_score'])
        for task, score in zip(tasks, priorities):
            writer.writerow([task['id'], score])

if __name__ == '__main__':
    main()
