// ===============================================
// ⭐ UNIVERSAL MATCHING GAME DATA (ALL KS LEVELS)
// ===============================================

export const matchingData = {

    // ============================
    // ⭐ KS3
    // ============================
    "KS3": {

        "Computer Systems": {

            // ⭐ Input / Output Devices
            "Input/Output Devices": [
                { left: "Mouse", right: "Input" },
                { left: "Keyboard", right: "Input" },
                { left: "Monitor", right: "Output" },
                { left: "Printer", right: "Output" },
                { left: "Touchscreen", right: "Both" },
                { left: "Speakers", right: "Output" },
                { left: "Microphone", right: "Input" },
                { left: "Projector", right: "Output" },
                { left: "Scanner", right: "Input" },
                { left: "Headphones", right: "Output" },
                { left: "Graphics Tablet", right: "Input" },
                { left: "VR Headset", right: "Both" },
                { left: "Smartboard", right: "Both" },
                { left: "Barcode Scanner", right: "Input" },
                { left: "Plotter", right: "Output" }
            ],

            // ⭐ Storage Types
            "Storage Devices": [
                { left: "SSD", right: "Solid State" },
                { left: "HDD", right: "Magnetic" },
                { left: "DVD", right: "Optical" },
                { left: "USB Stick", right: "Flash" },
                { left: "Blu-Ray", right: "Optical" },
                { left: "SD Card", right: "Flash" },
                { left: "CD", right: "Optical" },
                { left: "Memory Card", right: "Flash" },
                { left: "External HDD", right: "Magnetic" },
                { left: "Laptop SSD", right: "Solid State" },
                { left: "Game Disc", right: "Optical" },
                { left: "Pen Drive", right: "Flash" },
                { left: "Hard Drive", right: "Magnetic" },
                { left: "Phone Storage", right: "Flash" }
            ]
        },

        "Programming": {

            "Data Types": [

                { left: "age = 10", right: "Integer" },
                { left: "price = 4.99", right: "Float" },
                { left: "name = 'Alice'", right: "String" },
                { left: "is_raining = True", right: "Boolean" },
                { left: "score = 0", right: "Integer" },
                { left: "temperature = 18.5", right: "Float" },
                { left: "username = 'student123'", right: "String" },
                { left: "logged_in = False", right: "Boolean" },
                { left: "year = 2024", right: "Integer" },
                { left: "height = 1.72", right: "Float" },
                { left: "greeting = 'Hello!'", right: "String" },
                { left: "has_passed = True", right: "Boolean" },
                { left: "num_lives = 3", right: "Integer" },
                { left: "speed = 9.81", right: "Float" },
                { left: "colour = 'Blue'", right: "String" }
            ],

            "Variables and Values": [

                { left: "score = 200", right: "200 is the value" },
                { left: "cool_name = 'tom'", right: "cool_name is the variable" },
                { left: "age = 13", right: "13 is the value" },
                { left: "player = 'Ali'", right: "player is the variable" },
                { left: "speed = 9.8", right: "9.8 is the value" },
                { left: "username = 'student123'", right: "username is the variable" },
                { left: "points = 0", right: "0 is the value" },
                { left: "colour = 'Blue'", right: "colour is the variable" },
                { left: "height = 1.72", right: "1.72 is the value" },
                { left: "logged_in = True", right: "logged_in is the variable" },
                { left: "temperature = 18.5", right: "18.5 is the value" },
                { left: "name = 'Alice'", right: "name is the variable" },
                { left: "year = 2026", right: "2026 is the value" },
                { left: "has_passed = False", right: "has_passed is the variable" },
                { left: "message = 'Hello!'", right: "'Hello!' is the value" }
            ],

            "State the Output (If/Else)": [

                { left: "if score > 10: print('Win') else: print('Try again')", right: "Checks if score is greater than 10" },
                { left: "if age < 13: print('Child') else: print('Teen')", right: "Chooses based on age" },
                { left: "if coins > 50: print('Rich') else: print('Not rich')", right: "Compares number of coins" },
                { left: "if marbles < 10: print('Prize') else: print('No prize')", right: "Tests if marbles are less than 10" },
                { left: "if score == 0: print('Game Over') else: print('Keep playing')", right: "Checks if score equals 0" },
                { left: "if raining == True: print('Stay inside') else: print('Go outside')", right: "Uses a True or False condition" },
                { left: "if temp > 30: print('Hot') else: print('Cool')", right: "Compares temperature value" },
                { left: "if logged_in == False: print('Login required') else: print('Welcome')", right: "Checks login status" },
                { left: "if points >= 100: print('Level Up') else: print('Keep trying')", right: "Tests if points reach 100" },
                { left: "if score < 5: print('Low') else: print('High')", right: "Compares score value" },
                { left: "if age == 18: print('Adult') else: print('Minor')", right: "Checks if age equals 18" },
                { left: "if passed == True: print('Well done') else: print('Try again')", right: "Uses a boolean test" },
                { left: "if speed > 10: print('Fast') else: print('Slow')", right: "Compares speed value" },
                { left: "if score != 0: print('Active') else: print('Inactive')", right: "Checks if score is not zero" },
                { left: "if time < 60: print('Quick') else: print('Slow')", right: "Compares time taken" }
            ],

            "Scratch": [

                { left: "when green flag clicked", right: "Starts the program" },
                { left: "move 10 steps", right: "Moves sprite forward" },
                { left: "say 'Hello!'", right: "Shows speech bubble" },
                { left: "repeat 10", right: "Loops actions 10 times" },
                { left: "forever", right: "Repeats actions endlessly" },
                { left: "if on edge, bounce", right: "Makes sprite bounce off wall" },
                { left: "switch costume to 'jump'", right: "Changes sprite appearance" },
                { left: "play sound 'pop'", right: "Plays a sound" },
                { left: "go to x:0 y:0", right: "Moves sprite to centre" },
                { left: "hide", right: "Makes sprite invisible" },
                { left: "show", right: "Makes sprite visible" },
                { left: "wait 1 second", right: "Pauses actions briefly" },
                { left: "change x by 10", right: "Moves sprite horizontally" },
                { left: "change y by -10", right: "Moves sprite vertically" },
                { left: "broadcast 'start'", right: "Sends message to other sprites" }
            
            ],

            "Maths / Arithmetic": [

                { left: "print(4 + 6)", right: "Outputs 10" },
                { left: "print(3 * 5)", right: "Outputs 15" },
                { left: "print(12 - 7)", right: "Outputs 5" },
                { left: "print(20 / 4)", right: "Outputs 5.0" },
                { left: "print(9 + 1)", right: "Outputs 10" },
                { left: "print(2 * 8)", right: "Outputs 16" },
                { left: "print(30 - 10)", right: "Outputs 20" },
                { left: "print(5 * 2)", right: "Outputs 10" },
                { left: "print(9 - 3)", right: "Outputs 6" },
                { left: "print(10 / 2)", right: "Outputs 5.0" },
                { left: "print(7 + 3)", right: "Outputs 10" },
                { left: "print(8 * 4)", right: "Outputs 32" },
                { left: "print(15 - 5)", right: "Outputs 10" },
                { left: "print(9 / 3)", right: "Outputs 3.0" },
                { left: "print(2 + 2)", right: "Outputs 4" }
            ],

            "Sequence, Selection, Iteration": [

                { left: "print('Start') then print('End')", right: "Sequence" },
                { left: "if score > 10: print('Win')", right: "Selection" },
                { left: "repeat 10 times", right: "Iteration" },
                { left: "if raining == True: print('Stay inside')", right: "Selection" },
                { left: "for i in range(5): print(i)", right: "Iteration" },
                { left: "print('Hello') then print('World')", right: "Sequence" },
                { left: "while lives > 0: play()", right: "Iteration" },
                { left: "if age >= 18: print('Adult')", right: "Selection" },
                { left: "repeat until score == 10", right: "Iteration" },
                { left: "print('Ready') then print('Go!')", right: "Sequence" },
                { left: "if choice == 'A': print('Correct')", right: "Selection" },
                { left: "for number in range(3): print(number)", right: "Iteration" },
                { left: "print('Step 1') then print('Step 2')", right: "Sequence" },
                { left: "if answer == True: print('Yes')", right: "Selection" },
                { left: "repeat 5 times", right: "Iteration" }
            
            ]


        }

    },

    // ============================
    // ⭐ KS4 (example placeholder)
    // ============================
    "KS4": {

        "Cambridge_Nationals_IT_Level_2": {

            "R050: IT in the Digital World": {

                "Design Tools": {

                    "Types of design tools": [
                        { left: "Shows steps in a sequence", right: "Flowchart" },
                        { left: "Uses arrows to show direction", right: "Flowchart" },
                        { left: "Uses branches from a central idea", right: "Mind Map" },
                        { left: "Shows connections between ideas", right: "Mind Map" },
                        { left: "Shows colours, textures, and styles", right: "Mood Board" },
                        { left: "Used to inspire visual ideas", right: "Mood Board" },
                        { left: "Shows scenes in order", right: "Storyboard" },
                        { left: "Used for animations or video planning", right: "Storyboard" },
                        { left: "Shows layout of a webpage or app", right: "Wireframe" },
                        { left: "Uses simple boxes and placeholders", right: "Wireframe" },
                        { left: "Shows what a product will look like", right: "Visualisation Diagram" },
                        { left: "Includes annotations and labels", right: "Visualisation Diagram" }

                    ]

                }

            }

        }

    },


    // ============================
    // ⭐ KS5 (example placeholder)
    // ============================
    "KS5": {
        "OCR A Level Computer Science": {
            "Paper 1": {
                "Logic Gates": [
                    { left: "AND", right: "Both inputs must be 1" },
                    { left: "OR", right: "At least one input is 1" },
                    { left: "NOT", right: "Inverts the input" }
                ]
            }
        }
    }
};
