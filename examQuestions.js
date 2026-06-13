export const examQuestionBank = {

    "KS3": {

        "Computer Systems": {
            "Hardware Components": [
                {
                    question: "Sarah is designing a computer system where users need to enter text and numbers accurately. Which device should she include?",
                    answers: ["Monitor", "Printer", "Keyboard", "Speakers"],
                    correct: 2
                },
                {
                    question: "A school is setting up a computer to display presentations. Which device is most suitable?",
                    answers: ["Microphone", "Scanner", "Projector", "Keyboard"],
                    correct: 2
                },
                {
                    question: "Sohini wants to build a computer that can run programs. Which component is essential?",
                    answers: ["Cooling fan", "CPU", "Case", "Speakers"],
                    correct: 1
                },
                {
                    question: "A new computer cannot run applications yet. What must be installed first?",
                    answers: ["Spreadsheet software", "Operating system", "Web browser", "Presentation software"],
                    correct: 1
                },
                {
                    question: "Bilal needs to write an essay. Which software should he use?",
                    answers: ["Operating system", "Utility software", "Word processing application", "Antivirus software"],
                    correct: 2
                },
                {
                    question: "A computer is overheating during use. Which component helps keep the CPU cool?",
                    answers: ["RAM", "Heat sink", "Hard drive", "Graphics card"],
                    correct: 1
                },
                {
                    question: "Which component is responsible for temporarily storing data that the CPU is actively using?",
                    answers: ["Hard drive", "RAM", "Motherboard", "Power supply"],
                    correct: 1
                }
            ]
        },

        "Programming": {
            
            "Data Types": [
                {
                    question: "Which data type would be best for storing a whole number such as a score?",
                    answers: ["String", "Boolean", "Integer", "Float"],
                    correct: 2
                },
                {
                    question: "A program needs to store whether a student has completed their homework: true or false. Which data type should be used?",
                    answers: ["String", "Boolean", "Float", "Character"],
                    correct: 1
                },
                {
                    question: "Which data type is most suitable for storing a student’s name?",
                    answers: ["Integer", "Boolean", "String", "Float"],
                    correct: 2
                },
                {
                    question: "A temperature reading is stored as 19.5. What data type is this?",
                    answers: ["Boolean", "Integer", "Float", "String"],
                    correct: 2
                },
                {
                    question: "Which data type would be best for storing a single letter, such as 'A'?",
                    answers: ["Character", "Boolean", "Float", "Integer"],
                    correct: 0
                },
                {
                    question: "A program stores the value 42.0. Why is this NOT an integer?",
                    answers: ["It contains a decimal point", "It is too large", "It is a string", "It is a boolean"],
                    correct: 0
                }
            ],

            "Variables and Values": [
                {
                    question: "A programmer creates a variable called Score and stores the value 15. What is the variable called?",
                    answers: ["15", "Score", "Value", "Number"],
                    correct: 1
                },
                {
                    question: "In the statement Lives = 3, what is the value?",
                    answers: ["Lives", "=", "3", "Variable"],
                    correct: 2
                },
                {
                    question: "Which of the following is a variable name?",
                    answers: ["10", "True", "PlayerName", "\"Alex\""],
                    correct: 2
                },
                {
                    question: "A game stores the player's score in a variable called Score. The score increases from 5 to 6. What has changed?",
                    answers: ["The variable name", "The program", "The value", "The data type"],
                    correct: 2
                },
                {
                    question: "Which statement correctly describes a variable?",
                    answers: [
                        "A variable stores information that can change",
                        "A variable is always a number",
                        "A variable cannot be changed",
                        "A variable is a type of computer"
                    ],
                    correct: 0
                },
                {
                    question: "A programmer stores the text 'Sam' in a variable called PlayerName. What is the value?",
                    answers: ["PlayerName", "Text", "Sam", "Variable"],
                    correct: 2
                },
                {
                    question: "Why do programmers use variables?",
                    answers: [
                        "To make the computer heavier",
                        "To store and update information",
                        "To draw pictures on the screen",
                        "To turn off the computer"
                    ],
                    correct: 1
                }
            ],

            "Scratch": [

            {
                question: "Bob wants to make his sprite walk forward in his game. He wants it to move 3 steps when the green flag is clicked. Which block should he use?",
                answers: ["repeat 3", "move 3 steps", "go to x:3 y:3", "switch costume"],
                correct: 1
            },
            {
                question: "Aisha wants her sprite to speak to the player at the start of the game. She wants it to say 'Welcome!' for 2 seconds. Which block should she use?",
                answers: ["say 'Welcome!' for 2 seconds", "think 'Welcome!'", "broadcast 'Welcome!'", "play sound 'Welcome'"],
                correct: 0
            },
            {
                question: "Leo wants his sprite to disappear when it touches a ghost. Which block will hide the sprite?",
                answers: ["delete sprite", "stop all", "switch costume", "hide"],
                correct: 3
            },
            {
                question: "Mia wants her sprite to bounce off the edge when it reaches the wall. Which block should she use?",
                answers: ["if on edge, bounce", "repeat until edge", "go to x:0 y:0", "forever bounce"],
                correct: 0
            },
            {
                question: "Sam wants his sprite to keep moving forever in a maze game. Which block should he use?",
                answers: ["repeat 10", "wait 1 second", "forever", "stop this script"],
                correct: 2
            },
            {
                question: "Ella wants her sprite to change appearance when it gets a power‑up. Which block should she use?",
                answers: ["switch costume to powerup", "change backdrop", "play sound", "go to front layer"],
                correct: 0
            },
            {
                question: "Jake wants his sprite to start the game only when the player presses the green flag. Which event block should he use?",
                answers: ["when green flag clicked", "when space key pressed", "when sprite clicked", "when backdrop switches"],
                correct: 0
            }

            ],
            
            "Maths / Arithmetic": [
            {
                question: "Sarah is calculating the total cost of two items costing £4 and £6. What will print(4 + 6) output?",
                answers: ["46", "10", "4 + 6", "Error"],
                correct: 1
            },
            {
                question: "Tom scores 3 goals worth 5 points each. What does print(3 * 5) output?",
                answers: ["35", "8", "15", "3 * 5"],
                correct: 2
            },
            {
                question: "Liam has 12 sweets and gives 7 away. What will print(12 - 7) show?",
                answers: ["19", "5", "127", "Error"],
                correct: 1
            },
            {
                question: "Hannah shares 20 stickers equally between 4 friends. What does print(20 / 4) output?",
                answers: ["4", "5.0", "24", "Error"],
                correct: 1
            },
            {
                question: "Omar wants to know the total of 9 and 1. What will print(9 + 1) output?",
                answers: ["10", "91", "0", "9 + 1"],
                correct: 0
            },
            {
                question: "Aisha doubles the number 8 in her program. What does print(2 * 8) output?",
                answers: ["16", "28", "10", "Error"],
                correct: 0
            },
            {
                question: "Ben reduces his score from 30 to 10. What does print(30 - 10) output?",
                answers: ["3010", "20", "40", "Error"],
                correct: 1
            }
            ],

            "State the Output (If/Else)": [

            {
                question: "Eren has 15 marbles. Based on this code, what will be printed? if marbles < 10: print('Win prize') else: print('No prize')",
                answers: ["Win prize", "Error", "Nothing", "No prize"],
                correct: 3
            },
            {
                question: "Lily scored 3 points in a quiz. What will this code print? if score > 5: print('Great') else: print('Try again')",
                answers: ["Try again", "Great", "Error", "Nothing"],
                correct: 0
            },
            {
                question: "Adam is checking if he has enough money. He has £10. What will this code print? if money == 10: print('Exact') else: print('Not exact')",
                answers: ["Not exact", "Exact", "Error", "Nothing"],
                correct: 1
            },
            {
                question: "Sara has 2 pets. What will this code print? if pets > 5: print('Many') else: print('Few')",
                answers: ["Few", "Many", "Error", "Nothing"],
                correct: 0
            },
            {
                question: "Noah is checking if his age is less than 13. He is 14. What will this code print? if age < 13: print('Child') else: print('Teen')",
                answers: ["Teen", "Child", "Error", "Nothing"],
                correct: 0
            },
            {
                question: "Emily has 0 messages. What will this code print? if messages == 0: print('Empty') else: print('New messages')",
                answers: ["New messages", "Error", "Empty", "Nothing"],
                correct: 2
            },
            {
                question: "Jacob has 20 coins. What will this code print? if coins > 50: print('Rich') else: print('Not rich')",
                answers: ["Rich", "Not rich", "Error", "Nothing"],
                correct: 1
            }

            ],

            "Sequence, Selection, Iteration": [
            {
                question: "Amira is baking a cake and follows steps in order: mix → pour → bake. Which programming concept is this?",
                answers: ["Iteration", "Selection", "Sequence", "Variable"],
                correct: 2
            },
            {
                question: "Jayden wants his program to choose between two options depending on the score. Which concept does he need?",
                answers: ["Loop", "Sequence", "Selection", "Iteration"],
                correct: 2
            },
            {
                question: "Ella wants her character to repeat a dance move 10 times. Which concept is this?",
                answers: ["Selection", "Iteration", "Sequence", "Variable"],
                correct: 1
            },
            {
                question: "Maya follows instructions step‑by‑step to build a Lego model. Which concept is this?",
                answers: ["Iteration", "Sequence", "Selection", "Condition"],
                correct: 1
            },
            {
                question: "Owen wants his program to run code only if the player has more than 5 points. Which concept is this?",
                answers: ["Sequence", "Iteration", "Loop", "Selection"],
                correct: 3
            },
            {
                question: "Hassan wants his sprite to flap its wings over and over again. Which concept is this?",
                answers: ["Condition", "Sequence", "Iteration", "Selection"],
                correct: 2
            },
            {
                question: "Ruby wants her program to run instructions in the correct order so it works properly. Which concept is she using?",
                answers: ["Iteration", "Loop", "Sequence", "Selection"],
                correct: 2
            }
            ]




        }

    },

    "KS4": {
        "Cambridge_Nationals_IT_Level_2": {
            "R050: IT in the Digital World": {
                "Design Tools": {
                    "Types of design tools": [
                        {
                            question: "A company is planning a new mobile app and needs to test different layout ideas quickly before adding colours or images. Which design tool is most appropriate?",
                            answers: ["Storyboard", "Wireframe", "Mood Board", "Mind Map"],
                            correct: 1
                        },
                        {
                            question: "A designer wants to explore different visual themes for a new brand, including colours, textures, and inspirational images. Which design tool should they use?",
                            answers: ["Flowchart", "Wireframe", "Mood Board", "Storyboard"],
                            correct: 2
                        },
                        {
                            question: "A team is planning a promotional video and needs to show the sequence of scenes, camera angles, and timings. Which design tool is most suitable?",
                            answers: ["Storyboard", "Mind Map", "Wireframe", "Visualisation Diagram"],
                            correct: 0
                        },
                        {
                            question: "A student is planning a project and needs to break down a central idea into smaller linked concepts. Which design tool should they use?",
                            answers: ["Mind Map", "Flowchart", "Storyboard", "Mood Board"],
                            correct: 0
                        },
                        {
                            question: "A designer needs to show what a final poster will look like, including layout, fonts, and key visual elements. Which design tool is most appropriate?",
                            answers: ["Wireframe", "Visualisation Diagram", "Flowchart", "Mind Map"],
                            correct: 1
                        }
                    ]
                }
            }
        }
    }

};

