// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const cards = require('./cards')
const { ActivityHandler } = require('botbuilder');

/**
 * A simple bot that responds to utterances with answers from QnA Maker.
 * If an answer is not found for an utterance, the bot responds with help.
 */
class QnABot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[QnABot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[QnABot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[QnABot]: Missing parameter. dialog is required');
        
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        // Edited
        this.userProfileAccessor = userState.createProperty("userProfile");
        
        this.questions = {
            name:"What is your first name?",
            birthYear:"Nice to meet you [name]. Welcome to our service. I beieve I can offer you a ver good deal. A few more basic questions. What is your year of birth (example: 1990).",
            phoneNumber:"Lovely. What is [name] your phone number? E.g. 050 123 4567",
            postalCode:"Alright. Many of our customers are life-long clients. What is the zipcode of your primary residence? You can also find it by entering 'help'.",
            email:"Okay. I also need your email address, [name], to contact you with more information regarding the insurance you are interest in. Please enter your email address now",
            duration:cards.duration,
            luggage:"Okay. We offer luggage insurance ranging from 400 to 2000 euros. And there is no deductible! Please enter the number from 400 to 2000. You can also enter “0” if you wish not to insure your luggage.",
            medical:cards.medical,
            kela:cards.kela,
        }

        this.help = {
            name:"Your calling name",
            birthYear:"Family name",
            phoneNumber:"You should know this",
            postalCode:"You can check your postal code from https://www.posti.fi/fi/postinumerohaku",
            email:"Example matti@gmail.com",
            duration:"Click yes or No",
            luggage:"More information https://www.notreal/fi/luggage",
            medical:"test",
            kela:"test",
        }

        this.dialogs = {
            greeting:"Thank you for waking me up! I am grabbing coffee now. Whenever you are ready to get an estimate for your travel insurance, just type in 'form'.",
            formStop:"Tell me if you want to fill the form again",
            formReady:"Now the last steps. First, in the link below you can check if your form has been filled in correctly. Then we will take you to log in with your bank credentials for us to confirm your personal identity and we will send you more details by email. You can also call us at 09 453 3000 24/7 for any more information",
            bye:"It was very nice meeting you and I hope you will have a productive and entertaining trip! See you later [name]! Kind regards, always travel safe. Your Olavi"
        }

        this.onMessage(async (context, next) => {
            
            const userProfile = await this.userProfileAccessor.get(context, 
                { 
                    name:"", 
                    birthYear:"", 
                    phoneNumber:"", 
                    postalCode:"", 
                    email:"" ,
                    duration:"",
                    luggage:"",
                    medical:"",
                    kela:"",
                });
            const dialogData = await this.dialogState.get(context, { fillForm:false, question_key:"" })
            
            if(dialogData.fillForm && context.activity.text === "stop"){
                this.resetForm(userProfile)
                this.resetFillForm(dialogData)
                this.saveStates(context)
                await context.sendActivity(this.dialogs.formStop);
            }else if(dialogData.fillForm && context.activity.text === "help"){
                await context.sendActivity(this.help[dialogData.question_key]);
            }else if(dialogData.fillForm){
                userProfile[dialogData.question_key] = context.activity.text;
                const next_question = this.nextQuestion(userProfile)
                if(next_question !== ""){
                    await context.sendActivity(this.questions[next_question]);
                    dialogData.question_key = next_question
                }else{
                    this.saveQuestions(userProfile)
                    this.resetForm(userProfile)
                    this.resetFillForm(dialogData)
                    await context.sendActivity(this.dialogs.formReady);
                }
                this.saveStates(context)
            }else{
                await this.dialog.run(context, this.dialogState);
            }

            await next();
        });

        // If a new user is added to the conversation, send them a greeting message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(this.dialogs.greeting);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            //Save any state changes. The load happened during the execution of the Dialog.
            if(context.fillForm){
                const dialogData = await this.dialogState.get(context, {fillForm:false, question:""})
                dialogData.fillForm = true
                dialogData.question_key = "name"
                await context.sendActivity(this.questions.name);
            }
            this.saveStates(context)
            await next();
        });

    }

    nextQuestion(filledQuestions){
        const questions_list = Object.entries(filledQuestions)
        const empty_question = questions_list.find((val) => {
            if(val[1] === ""){
                return true
            }
        })
        if(empty_question === undefined){
            return ""
        }
        return empty_question[0]
    }

    saveQuestions(userprofile){
        // Save questions to database
        return null
    }
    
    
    resetForm(userProfile){
        const user_keys = Object.keys(userProfile)
        user_keys.forEach((val) => {
            userProfile[val] = ""
        })
    }

    resetFillForm(dialogData){
        dialogData.fillForm = false
        dialogData.question_key = ""
    }

    async saveStates(context){
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }


}

module.exports.QnABot = QnABot;

