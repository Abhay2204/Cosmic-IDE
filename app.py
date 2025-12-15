#!/usr/bin/env python3
"""
Simple Python Flask Web App
"""

print("🐍 Python App Starting...")
print("=" * 40)

def main():
    print("Hello from Cosmic IDE!")
    print("This is a simple Python application.")
    
    # Simple calculator
    print("\n🧮 Simple Calculator:")
    a = 10
    b = 5
    
    print(f"{a} + {b} = {a + b}")
    print(f"{a} - {b} = {a - b}")
    print(f"{a} * {b} = {a * b}")
    print(f"{a} / {b} = {a / b}")
    
    # List operations
    print("\n📝 List Operations:")
    fruits = ["apple", "banana", "orange", "grape"]
    print(f"Fruits: {fruits}")
    print(f"First fruit: {fruits[0]}")
    print(f"Number of fruits: {len(fruits)}")
    
    print("\n✅ Python app completed successfully!")

if __name__ == "__main__":
    main()