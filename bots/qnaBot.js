// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
            firstName:"What is your first name?",
            lastName:"What is your last name?",
            phoneNumber:"What is your phone number?",
            postalCode:"What is your postalcode?"
        }

        this.onMessage(async (context, next) => {
            // https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-state?view=azure-bot-service-4.0&tabs=javascript <-- check
            const userProfile = await this.userProfileAccessor.get(context, { firstName:"", lastName:"", phoneNumber:"", postalCode:"" } );
            const dialogData = await this.dialogState.get(context, { fillForm:false, question_key:"" })
            
            if(dialogData.fillForm){
                userProfile[dialogData.question_key] = context.activity.text;
                const next_question = this.nextQuestion(userProfile)
                if(next_question !== "" && context.activity.text !== "stop"){
                    await context.sendActivity(this.questions[next_question]);
                    dialogData.question_key = next_question
                }else if(context.activity.text === "stop"){
                    this.resetForm(userProfile)
                    this.resetFillForm(dialogData)
                    await context.sendActivity("Tell me if you want to fill the form again");
                }else{
                    this.saveQuestions(userProfile)
                    this.resetForm(userProfile)
                    this.resetFillForm(dialogData)
                    await context.sendActivity("Your form is now ready");
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
                    await context.sendActivity('mörkö says hello');
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
                dialogData.question_key = "firstName"
                await context.sendActivity(this.questions.firstName);
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

// await context.sendActivity(this.userState.name); -> send message