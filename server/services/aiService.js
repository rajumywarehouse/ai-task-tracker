const logger = require('../config/logger');

let openai = null;
const USE_MOCK_AI = !process.env.OPENAI_API_KEY || process.env.USE_MOCK_AI === 'true';

if (!USE_MOCK_AI) {
    const OpenAI = require('openai');
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✓ Using OpenAI API');
} else {
    console.log('✓ Using mock AI responses (static mode)');
}

class AIService {
    async generateTaskReminder(tasks, userName) {
        if (USE_MOCK_AI || !openai) {
            return this.getFallbackReminder(tasks, userName);
        }

        try {
            const taskSummary = tasks.map(t => ({
                id: t.task_id,
                description: t.task_description,
                priority: t.priority,
                dueDate: t.target_date,
                status: t.status,
                isOverdue: new Date(t.sla_deadline) < new Date()
            }));

            const overdueCount = taskSummary.filter(t => t.isOverdue).length;
            const highPriorityCount = taskSummary.filter(t => t.priority === 'High').length;

            const prompt = `Generate a personalized, professional task reminder message for ${userName}.

Tasks:
${JSON.stringify(taskSummary, null, 2)}

Key stats:
- Total tasks: ${tasks.length}
- Overdue: ${overdueCount}
- High priority: ${highPriorityCount}

Create a concise, actionable message that:
1. Greets the person professionally
2. Summarizes their task status
3. Highlights urgent items
4. Encourages action
5. Keeps it under 200 words

Format for WhatsApp/Email.`;

            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a professional task management assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            });

            return response.choices[0].message.content;
        } catch (error) {
            logger.error('AI reminder generation error:', error);
            return this.getFallbackReminder(tasks, userName);
        }
    }

    async generateEscalationMessage(task, escalationLevel) {
        const daysOverdue = Math.floor((new Date() - new Date(task.sla_deadline)) / (1000 * 60 * 60 * 24));
        
        if (USE_MOCK_AI || !openai) {
            return `URGENT: Task #${task.task_id} "${task.task_description}" has exceeded SLA by ${daysOverdue} days.\n\nPriority: ${task.priority}\nAssigned to: ${task.responsible_person_name}\nEscalation Level: ${escalationLevel}\n\nImmediate attention required.`;
        }

        try {
            const prompt = `Generate an escalation message for a delayed task.

Task Details:
- ID: ${task.task_id}
- Description: ${task.task_description}
- Priority: ${task.priority}
- Assigned to: ${task.responsible_person_name}
- Days overdue: ${daysOverdue}
- Escalation Level: ${escalationLevel}

Create a professional escalation message that:
1. States the urgency clearly
2. Provides task context
3. Requests immediate action
4. Is appropriate for level ${escalationLevel} (0=Team, 1=Manager, 2=Senior Leader)
5. Keeps it under 150 words`;

            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a professional escalation management assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.6,
                max_tokens: 250
            });

            return response.choices[0].message.content;
        } catch (error) {
            logger.error('AI escalation generation error:', error);
            return `URGENT: Task #${task.task_id} has exceeded SLA by ${daysOverdue} days. Immediate attention required.`;
        }
    }

    async generateLeaderSummary(tasks, users) {
        const overdueTasks = tasks.filter(t => new Date(t.sla_deadline) < new Date() && t.status !== 'Completed');
        const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');
        
        const userWorkload = {};
        tasks.forEach(task => {
            if (task.status !== 'Completed') {
                userWorkload[task.responsible_person_id] = (userWorkload[task.responsible_person_id] || 0) + 1;
            }
        });

        if (USE_MOCK_AI || !openai) {
            return `📊 Executive Summary\n\n🔴 Top Risks:\n• ${overdueTasks.length} tasks overdue\n• ${highPriorityTasks.length} high-priority tasks pending\n• ${Object.keys(userWorkload).length} team members with active tasks\n\n💡 Recommendations:\n• Prioritize overdue high-priority items\n• Review team workload distribution\n• Consider escalating critical tasks\n\n📈 Status: ${tasks.filter(t => t.status !== 'Completed').length} active tasks requiring attention`;
        }

        try {
            const prompt = `Generate an executive summary for a leader.

Metrics:
- Total active tasks: ${tasks.filter(t => t.status !== 'Completed').length}
- Overdue tasks: ${overdueTasks.length}
- High priority pending: ${highPriorityTasks.length}
- Team members with tasks: ${Object.keys(userWorkload).length}

Create a concise executive summary that:
1. Highlights top risks
2. Identifies bottlenecks
3. Suggests actions
4. Keeps it under 200 words
5. Uses bullet points for clarity`;

            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are an executive assistant providing leadership insights.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            });

            return response.choices[0].message.content;
        } catch (error) {
            logger.error('AI summary generation error:', error);
            return 'Summary generation temporarily unavailable.';
        }
    }

    async interpretWhatsAppMessage(message, userId) {
        try {
            const prompt = `Parse this WhatsApp message from a user updating their tasks:

Message: "${message}"

Extract:
1. Task ID (if mentioned)
2. Action (completed, delayed, update, etc.)
3. New status
4. Additional notes
5. Delay duration (if mentioned)

Return JSON format:
{
    "taskId": number or null,
    "action": "completed" | "delayed" | "update" | "query",
    "status": "Completed" | "In Progress" | "Delayed" | null,
    "notes": string,
    "delayDays": number or null
}`;

            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a task update parser. Always return valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 200
            });

            const content = response.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return { action: 'query', notes: message };
        } catch (error) {
            logger.error('WhatsApp message interpretation error:', error);
            return { action: 'query', notes: message };
        }
    }

    getFallbackReminder(tasks, userName) {
        const overdueCount = tasks.filter(t => new Date(t.sla_deadline) < new Date()).length;
        const highPriorityCount = tasks.filter(t => t.priority === 'High').length;
        
        return `Hi ${userName},\n\nYou have ${tasks.length} pending task(s):\n- ${overdueCount} overdue\n- ${highPriorityCount} high priority\n\nPlease update status today.\n\nThank you!`;
    }
}

module.exports = new AIService();
