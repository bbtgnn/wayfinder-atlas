import type { Issue } from '../../.velite/index.js'
import { normalizeBlockedBy } from '../content/normalize-blocked-by'
import { extractAnswerGist } from './answer-gist'
import { isTicketStatus, ticketKey, type Ticket } from './types'

export function toTicket(issue: Issue): Ticket {
	if (!isTicketStatus(issue.status)) {
		throw new Error(
			`wayfinder projection: unexpected status ${JSON.stringify(issue.status)} on ${ticketKey(issue.effort, issue.ticketSlug)}`
		)
	}
	const body = issue.content
	const answerGist = extractAnswerGist(body)
	return {
		effort: issue.effort,
		ticketNumber: issue.ticketNumber,
		ticketSlug: issue.ticketSlug,
		title: issue.title,
		type: issue.type,
		status: issue.status,
		blockedBy: normalizeBlockedBy(issue.blockedBy),
		body,
		...(answerGist !== undefined ? { answerGist } : {})
	}
}
