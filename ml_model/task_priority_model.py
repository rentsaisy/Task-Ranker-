"""
Task Priority ML Model
Calculates task priority based on deadline, difficulty, and weight
Uses a trained Random Forest model for priority prediction
"""

import sys
import json
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class TaskPriorityModel:
    def __init__(self):
        """Initialize the model with pre-trained weights"""
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self._train_model()
    
    def _train_model(self):
        """Train the model with synthetic training data"""
        # Generate synthetic training data based on task priority rules
        # Features: [days_until_due, difficulty, weight]
        # Target: priority_score (0-100)
        
        np.random.seed(42)
        n_samples = 1000
        
        # Generate features
        days_until_due = np.random.randint(0, 30, n_samples)
        difficulty = np.random.randint(1, 11, n_samples)
        weight = np.random.randint(1, 11, n_samples)
        
        X = np.column_stack([days_until_due, difficulty, weight])
        
        # Calculate target priority scores
        # Priority increases with: higher difficulty, higher weight, closer deadline
        y = []
        for i in range(n_samples):
            days = days_until_due[i]
            diff = difficulty[i]
            w = weight[i]
            
            # Urgency score (closer deadline = higher priority)
            if days == 0:
                urgency = 50
            elif days <= 1:
                urgency = 40
            elif days <= 3:
                urgency = 30
            elif days <= 7:
                urgency = 20
            else:
                urgency = max(0, 15 - (days / 2))
            
            # Difficulty score (harder tasks = higher priority)
            difficulty_score = diff * 3
            
            # Weight score (more important = higher priority)
            weight_score = w * 2
            
            # Combined priority (0-100 scale)
            priority = min(100, urgency + difficulty_score + weight_score)
            
            # Add some noise for realism
            priority += np.random.normal(0, 3)
            priority = np.clip(priority, 0, 100)
            
            y.append(priority)
        
        y = np.array(y)
        
        # Train the model
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled, y)
    
    def calculate_days_until_due(self, due_date_str):
        """Calculate days remaining until due date"""
        try:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
            today = datetime.now()
            delta = due_date - today
            return max(0, delta.days)
        except:
            return 7  # Default to 7 days if parsing fails
    
    def predict_priority(self, task):
        """
        Predict priority score for a single task
        
        Args:
            task: dict with keys 'due_date', 'difficulty', 'weight'
        
        Returns:
            float: priority score (0-100)
        """
        days_until_due = self.calculate_days_until_due(task.get('due_date', ''))
        difficulty = int(task.get('difficulty', 5))
        weight = int(task.get('weight', 5))
        
        # Create feature vector
        X = np.array([[days_until_due, difficulty, weight]])
        X_scaled = self.scaler.transform(X)
        
        # Predict priority
        priority = self.model.predict(X_scaled)[0]
        
        # Ensure score is between 0-100
        priority = np.clip(priority, 0, 100)
        
        return round(float(priority), 2)
    
    def predict_batch(self, tasks):
        """
        Predict priority scores for multiple tasks
        
        Args:
            tasks: list of dicts with keys 'due_date', 'difficulty', 'weight'
        
        Returns:
            list of floats: priority scores
        """
        if not tasks:
            return []
        
        features = []
        for task in tasks:
            days_until_due = self.calculate_days_until_due(task.get('due_date', ''))
            difficulty = int(task.get('difficulty', 5))
            weight = int(task.get('weight', 5))
            features.append([days_until_due, difficulty, weight])
        
        X = np.array(features)
        X_scaled = self.scaler.transform(X)
        
        priorities = self.model.predict(X_scaled)
        priorities = np.clip(priorities, 0, 100)
        
        return [round(float(p), 2) for p in priorities]


def main():
    """Main function to handle command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        # Initialize model
        model = TaskPriorityModel()
        
        # Check if single task or batch
        if isinstance(input_data, list):
            # Batch prediction
            priorities = model.predict_batch(input_data)
            result = {"priorities": priorities}
        else:
            # Single task prediction
            priority = model.predict_priority(input_data)
            result = {"priority": priority}
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
