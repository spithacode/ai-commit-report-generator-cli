import { StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BulletPoints, BulletPointsSchema, Commit } from "./schemas";
import { CommitSummary } from "./commitSummary";
import { RunnableSequence } from "@langchain/core/runnables";

export class DailyReportAIGenerator{
    private readonly llm: ChatGoogleGenerativeAI;
    private readonly prompt: PromptTemplate;
    private readonly parser: StructuredOutputParser<typeof BulletPointsSchema>
    constructor(){

        this.parser = StructuredOutputParser.fromZodSchema(BulletPointsSchema)
        this.prompt =  new PromptTemplate({
            template:`
            You're a business report writer who specializes in making complex technical changes easy to understand for non-technical stakeholders. Your task is to create a clear, simple summary of the changes made.

            Follow these steps:
            1. Review the list of changes below:
            {commits}

            2. Create a bullet-point report that:
               - Uses simple, everyday language
               - Avoids technical terms and jargon
               - Focuses on business value and user-facing improvements
               - Explains changes in terms of what they mean for users/stakeholders
               - Groups related changes together when possible
               - Includes specific improvements and their benefits

            3. Make sure each bullet point is:
               - Written in plain English
               - Easy to understand by someone with no technical background
               - Focused on what was improved rather than how it was done
            4. The number of bullet points should be equal to {numberOfCommits}
            

            5. Follow this format:
            {format_instructions}
            `,
            inputVariables:[
                'commits',
                'format_instructions',
                'numberOfCommits'

            ]

        })
        this.llm = new ChatGoogleGenerativeAI({

            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-2.0-flash-exp",
        })

    }
    generateReport(data:{commit:Commit, summary:CommitSummary}[]){

        return this.buildChain().invoke({
            numberOfCommits: data.length,
            commits:data.map(d=>
                `
                - Commit: ${d.commit.hash}\n
                **Date**:\n
                ${d.commit.date}\n
                **Message**:\n
                ${d.commit.message}\n
                **Summary**:\n
                ${d.summary.summary}\n
                **Changes**\n
                ${d.summary.changes.map(f=>
                    `
                    - ${f}
                    `).join('\n')}
                `).join('\n'),
            format_instructions: this.parser.getFormatInstructions()

        })
        }

    private buildChain(){
        return  RunnableSequence.from([
            this.prompt,
            this.llm,
            this.parser,

        ])

    }

}