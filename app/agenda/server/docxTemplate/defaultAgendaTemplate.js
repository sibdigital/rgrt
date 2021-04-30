import { Meteor } from 'meteor/meteor';
import {
	AlignmentType,
	Document,
	Packer,
	PageOrientation,
	Paragraph,
	TextRun,
	TabStopType,
} from 'docx';
import moment from 'moment';
import _ from 'underscore';

import { Agendas, Councils } from '../../../models';
import { findPersons } from '../../../api/server/lib/persons';

function romanize(num) {
	if (!+num) {
		return false;
	}

	var digits = String(+num).split(''),
		key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
			'', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
			'', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'],
		roman = '',
		i = 3;
	while (i--) {
		roman = (key[+digits.pop() + (i * 10)] || '') + roman;
	}
	return Array(+digits.join('') + 1).join('M') + roman;
}

const preProcessingProtocolItems = (item, strItem) => {
	const regExp = new RegExp('(<[^>]*>)*(&nbsp;)*', 'gi');
	const name = typeof item === 'number' ? item.toString() : item;
	let replaced = '';

	let isError = true;
	let isReplaced = false;

	// console.dir({ type: typeof item, strItem });

	try {
		if (name.replace) {
			replaced = name.replace(regExp, '');
			isReplaced = true;
		}
	} catch (error) {
		isError = true;
	}

	if (isError) {
		try {
			if (!isReplaced && name.replaceAll) {
				replaced = name.replaceAll(regExp, '');
			}
		} catch (error) {
			isError = true;
		}
	}

	return replaced;
};

function constructPersonFIO(responsible) {
	if (!responsible || typeof responsible !== 'object') {
		return responsible;
	}
	if (!responsible.surname && !responsible.name && !responsible.patronymic) {
		return responsible;
	}
	return [responsible.surname ?? '', ' ', responsible.name?.substr(0, 1) ?? '', '.', responsible.patronymic?.substr(0, 1) ?? '', '.'].join('');
}

function constructPersonFullFIO(person) {
	if (!person || typeof person !== 'object') {
		return '';
	}
	if (!person.surname && !person.name && !person.patronymic) {
		return '';
	}
	return [person.surname ?? '', person.name ?? '', person.patronymic ?? ''].join(' ');
}

function getHeaderParagraph(protocol) {
	return new Paragraph({
		children: [
			new Paragraph({
				children: [
					new TextRun({
						text: 'ПРОТОКОЛ',
						bold: true,
					}),
				],
			}),

			new Paragraph({
				children: [
					new TextRun({
						text: 'Заседания комиссии Государственного совета Российской Федерации по направлению «Транспорт»',
					}),
				],
			}),

			new Paragraph({
				children: [
					new TextRun({
						text: protocol?.place ?? 'Место проведения',
					}),
				],
			}),
		],
		alignment: AlignmentType.CENTER,
	});
}

function getProtocolSectionParagraphs(agenda) {
	if (!agenda || !agenda.sections) {
		return [];
	}

	const result = [];

	agenda.sections.forEach((section, sectionIndex) => {
		console.dir({ section });
		result.push(new Paragraph({
			children: [
				new TextRun({
					text: [section.item && section.item !== '' ? section.item : sectionIndex + 1, '. ', 'Рассматриваемый вопрос'].join(''),
				}),
			],
			indent: {
				firstLine: 720,
			},
			style: 'defaultFontStyle',
		}));

		result.push(new Paragraph({
			children: [
				new TextRun({
					text: section.issueConsideration,
				}),
			],
			indent: {
				firstLine: 1080,
			},
			// alignment: AlignmentType.JUSTIFIED,
			style: 'defaultFontStyle',
		}));

		if (section.initiatedBy && section.initiatedBy._id) {
			result.push(new Paragraph({
				children: [
					new TextRun({
						text: 'Инициатор: ',
					}),
					new TextRun({
						text: constructPersonFullFIO(section.initiatedBy),
					}),
				],
				indent: {
					firstLine: 720,
				},
				style: 'defaultFontStyle',
			}));
		}

		if (_.isArray(section.speakers) && section.speakers.length > 0) {
			let speakersString = '';

			section.speakers.forEach((speaker, index) => {
				if (index > 0) {
					speakersString = speakersString.concat(', ');
				}
				speakersString = speakersString.concat(constructPersonFIO(speaker));
			});

			result.push(new Paragraph({
				children: [
					new TextRun({
						text: 'Выступающие: ',
					}),
					new TextRun({
						text: speakersString,
					}),
				],
				indent: {
					firstLine: 720,
				},
				style: 'defaultFontStyle',
			}));

		}
	});

	return result;
}

async function getParticipants(protocol) {
	if (!protocol || !protocol.participants || !_.isArray(protocol.participants)) {
		return [];
	}

	const cursor = await findPersons({ query: { _id: { $in: protocol.participants } }, fields: { surname: 1, name: 1, patronymic: 1 }, pagination: { offset: 0, count: 500, sort: null } });

	const participants = cursor.persons;

	const result = [];

	participants.forEach((person, index) => {
		result.push(new Paragraph({
			children: [
				new TextRun({
					text: [`${ index + 1 }.`, person.surname ?? '', person.name ?? '', person.patronymic ?? ''].join(' '),
				}),
			],
			alignment: AlignmentType.LEFT,
			indent: {
				firstLine: 1080,
			},
			style: 'defaultFontStyle',
		}));
	});

	return result;
}

Meteor.methods({
	async defaultAgendaTemplate({ agendaId, councilId }) {

		if (!agendaId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field agendaId is required', { method: 'defaultAgendaTemplate', field: 'agendaId' });
		}

		if (!councilId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field councilId is required', { method: 'defaultAgendaTemplate', field: 'councilId' });
		}

		const agenda = await Agendas.findOne({ _id: agendaId });
		const council = await Councils.findOne({ _id: councilId });

		if (!agenda) {
			throw new Meteor.Error('error-the-agenda-is-not-found', 'The agenda is not found', { method: 'defaultAgendaTemplate', field: 'agenda' });
		}

		if (!council) {
			throw new Meteor.Error('error-the-council-is-not-found', 'The council is not found', { method: 'defaultAgendaTemplate', field: 'council' });
		}
		console.dir({ agenda, council });

		const sectionsParagraphs = getProtocolSectionParagraphs(agenda);

		// const participantsParagraphs = await getParticipants(protocol);

		const doc = new Document({
			styles: {
				paragraphStyles: [
					{
						id: 'defaultFontStyle',
						name: 'defaultFontStyle',
						basedOn: 'Normal',
						next: 'Normal',
						quickFormat: true,
						run: {
							size: 28,
						},
						paragraph: {
							spacing: {
								line: 360,
							},
							alignment: AlignmentType.JUSTIFIED,
						},
					},
				],
			},
		});

		const getMaxTabs = (nums) => {
			const t = [];
			for (let i = 0; i < nums; i++) {
				t.push('\t');
			}
			return t;
		};

		const protocolParagraphArray = [
			new Paragraph({
				children: [
					new TextRun({
						text: agenda.name,
						bold: true,
					}),
				],
				style: 'defaultFontStyle',
				alignment: AlignmentType.CENTER,
			}),

			new Paragraph({
				children: [
					new TextRun({
						text: ['№ ', agenda.number].join(''),
					}),
				],
				style: 'defaultFontStyle',
				alignment: AlignmentType.CENTER,
				spacing: {
					after: 120,
				},
			}),
		];

		// console.dir({ sectionsParagraphs });

		if (_.isArray(sectionsParagraphs) && sectionsParagraphs.length > 0) {
			sectionsParagraphs.forEach((secPar) => protocolParagraphArray.push(secPar));
		}

		// console.dir({ protocolParagraphArray });

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: protocolParagraphArray,
		});

		// const attachmentParagraphArray = [
		// 	new Paragraph({
		// 		children: [
		// 			new TextRun({
		// 				text: 'Приложение 1',
		// 				bold: true,
		// 			}),
		// 		],
		// 		style: 'defaultFontStyle',
		// 		alignment: AlignmentType.CENTER,
		// 	}),

		// 	new Paragraph({
		// 		children: [
		// 			new TextRun({
		// 				text: 'Участники протокола',
		// 			}),
		// 		],
		// 		style: 'defaultFontStyle',
		// 		alignment: AlignmentType.CENTER,
		// 	}),
		// ];

		// if (_.isArray(participantsParagraphs) && participantsParagraphs.length > 0) {
		// 	participantsParagraphs.forEach((partPar) => attachmentParagraphArray.push(partPar));
		// }
		// // console.dir({ attachmentParagraphArray });

		// doc.addSection({
		// 	size: {
		// 		orientation: PageOrientation.LANDSCAPE,
		// 	},
		// 	children: attachmentParagraphArray,
		// });

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
