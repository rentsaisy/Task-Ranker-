"""
Task Priority Scoring Model
Calculates normalized priority scores for tasks based on deadline, difficulty, and weight
"""

import sys
import json
from datetime import datetime

class TaskPriorityModel:
    def __init__(self):
        pass
    
    def calculate_days_until_due(self, due_date_str):
        """Calculate days remaining until due date (supports ISO 8601)"""
        try:
            if 'T' in due_date_str:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', ''))
            else:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
            today = datetime.now()
            delta = due_date - today
            return max(0, delta.days)
        except Exception as e:
            print(f"Error parsing due_date '{due_date_str}': {e}", file=sys.stderr)
            return 7
    
    def predict_priority(self, task):
        """
        Predict raw priority score for a single task (not normalized)
        Urgency (deadline) is weighted much higher for more differentiation.
        Task type influences score (e.g., 'work' > 'personal' > 'other').
        """
        days_until_due = self.calculate_days_until_due(task.get('due_date', ''))
        difficulty = int(task.get('difficulty', 1))
        weight = int(task.get('weight', 1))
        type_name = str(task.get('type', '')).lower()
        # Stronger urgency: closer deadline = much higher score
        urgency_score = max(0, 30 - days_until_due) * 50
        # Difficulty: 1-5
        difficulty_score = difficulty * 1
        # Weight: 1-10
        weight_score = weight * 1
        # Type bonus: customize as needed
        type_bonus = 0
        if type_name == 'work':
            type_bonus = 20
        elif type_name == 'personal':
            type_bonus = 10
        elif type_name:
            type_bonus = 5
        # Total raw score
        return urgency_score + difficulty_score + weight_score + type_bonus
    
    def predict_batch(self, tasks):
        """
        Predict normalized priority scores for multiple tasks (sum = 100)
        """
        if not tasks:
            return []
        raw_scores = [self.predict_priority(task) for task in tasks]
        total = sum(raw_scores)
        if total > 0:
            normalized = [round(score / total * 100, 2) for score in raw_scores]
        else:
            normalized = [0 for _ in raw_scores]
        return normalized


def main():
    """Main function to handle command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        # Print all arguments for debugging
        print(f"sys.argv: {sys.argv}", file=sys.stderr)
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            print("No input provided to script", file=sys.stderr)
            sys.exit(1)
        # Parse input JSON
        input_arg = sys.argv[1]
        print(f"Received input: {input_arg}", file=sys.stderr)
        if not input_arg.strip():
            print(json.dumps({"error": "Empty input argument"}))
            print("Input argument is empty", file=sys.stderr)
            sys.exit(1)
        input_data = json.loads(input_arg)
        # Initialize model
        model = TaskPriorityModel()
        # Check if single task or batch
        if isinstance(input_data, list):
            priorities = model.predict_batch(input_data)
            result = {"priorities": priorities}
        else:
            priority = model.predict_priority(input_data)
            result = {"priority": priority}
        print(json.dumps(result))
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e)}))
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
