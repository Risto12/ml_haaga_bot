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
            name:"What is your name?",
            birthYear:"Happy to meet you [name] , What is your birth year?",
            phoneNumber:"What is your phonenumber?",
            postalCode:"Please enter postal code",
            email:"Please enter email",
            duration:cards.duration,
            luggage:"Insurance coverage for luggage (0-400)",
            medical:cards.medical,
            kela:cards.kela,
        }

        this.help = {
            name:"Your calling name",
            birthYear:"Year you were born in format of yyyy",
            phoneNumber:"Informat +358...",
            postalCode:"You can check your postal code from https://www.posti.fi/fi/postinumerohaku",
            email:"Example matti@gmail.com",
            duration:"Click yes or No",
            luggage:"More information https://www.notreal/fi/luggage",
            medical:"More information https://www.notreal/fi/medical",
            kela:"More information https://www.notreal/fi/kela",
        }

        this.dialogs = {
            greeting:"Hello there. You can talk to me if you want. Enter fill form to fill the form on the webpage",
            formStop:"Form filling has stopped",
            formReady:"Form is ready",
            bye:"See you later alligator"
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
            const dialogData = await this.dialogState.get(context, { fillForm: false, questionKey: "" })
            
            if(dialogData.fillForm){
                switch(context.activity.text) {
                    case "stop":
                        this.resetForm(userProfile)
                        this.resetFillForm(dialogData)
                        this.saveStates(context)
                        await context.sendActivity(this.dialogs.formStop);
                        break;
                    case "help":
                        await context.sendActivity(this.help[dialogData.questionKey]);
                        break;
                    default:
                        this.saveAnswerToState(userProfile, dialogData.questionKey, context.activity.text)
                        const nextQuestion = this.nextQuestion(userProfile)
                        if(nextQuestion !== ""){
                            const nextQuestion_checked = this.isObject(nextQuestion) ? this.questions[nextQuestion] : this.addNameToQuestion(this.questions[nextQuestion], userProfile.name)
                            await context.sendActivity(nextQuestion_checked);
                            dialogData.questionKey = nextQuestion
                        }else{
                            await context.sendActivity(this.dialogs.formReady);
                            await context.sendActivity(await this.createUrl(userProfile));
                            await context.sendActivity(this.dialogs.bye);
                            this.saveQuestions(userProfile)
                            this.resetForm(userProfile)
                            this.resetFillForm(dialogData)
                        }
                        this.saveStates(context)
                        break;
                } 
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
                dialogData.questionKey = "name"
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

    async createUrl(userProfile){
        return cards.url(`http://vesanto.me:8071/readyform.html?email=${userProfile.email}&name=${userProfile.name}&phoneNumber=${userProfile.phoneNumber}&postalCode=${userProfile.postalCode}&luggage=${userProfile.luggage}&birthYear=${userProfile.birthYear}&duration=${userProfile.duration}&kela=${userProfile.kela}&medical=${userProfile.medical}`)
    }

    addNameToQuestion(question, name){
        return question.replace("[name]", name)
    }

    saveAnswerToState(userProfile, questionKey, answer){
        userProfile[questionKey] = answer;
    }

    isObject(nextQuestion){
        return typeof(this.questions[nextQuestion]) === 'object'
    }

}

module.exports.QnABot = QnABot;

