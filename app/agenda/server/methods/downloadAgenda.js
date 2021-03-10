import { Meteor } from 'meteor/meteor';
import {
	AlignmentType,
	Document,
	HeadingLevel,
	Indent,
	Numbering,
	Packer,
	PageOrientation,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun, VerticalAlign, WidthType,
} from 'docx';
import moment from 'moment';

import { Agendas } from '../../../models';

Meteor.methods({
	async downloadAgenda({ _id, dateString = null }) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadAgenda', field: '_id' });
		}

		const agenda = await Agendas.findOne({ _id });

		// const persons = Persons.find({ _id: { $in: council.invitedPersons.map((iPerson) => iPerson._id) } }) || [];

		if (!agenda) {
			throw new Meteor.Error('error-the-field-is-required', `The council with _id: ${ _id } doesn't exist`, { method: 'downloadAgenda', field: 'agenda' });
		}

		const doc = new Document();

		const agendaRow = [
			new Paragraph({
				children: [
					new TextRun({
						text: `Отчет сформирован ${ moment(new Date()).format('DD MMMM YYYY, HH:mm') }`,
					}),
				],
				alignment: AlignmentType.RIGHT,
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'Повестка мероприятия',
					}),
				],
				heading: HeadingLevel.HEADING_1,
				alignment: AlignmentType.CENTER,
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: `От ${ dateString ?? moment(agenda.ts).format('DD MMMM YYYY, HH:mm') }`,
					}),
				],
				heading: HeadingLevel.HEADING_2,
				alignment: AlignmentType.CENTER,
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: agenda.name,
					}),
				],
				heading: HeadingLevel.HEADING_3,
				alignment: AlignmentType.CENTER,
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: `№ ${ agenda.number }`,
					}),
				],
				heading: HeadingLevel.HEADING_3,
				alignment: AlignmentType.CENTER,
			}),
		];

		const getSectionChildren = (section, speakers) => {
			const arr = [
				new Paragraph({
					text: 'Пункт',
					children: [
						new TextRun({
							text: `${ section.item && section.item.trim() !== '' ? section.item : 'Пункт' }`,
							color: '000000',
						}),
					],
				}),
				new Paragraph({
					text: 'Рассматриваемый вопрос',
					children: [
						new TextRun({
							text: `${ section.issueConsideration && section.issueConsideration.trim() !== '' ? section.item : 'Рассматриваемый вопрос' } `,
							color: '000000',
						}),
					],
				}),
				new Paragraph({
					text: 'Инициатор',
					children: [
						new TextRun({
							text: `${ section.initiatedBy && section.initiatedBy.value ? section.initiatedBy.value : 'Инициатор' }`,
							color: '000000',
						}),
					],
				}),
				// new TextRun({
				// 	text: `     ${ section.item && section.item.trim() !== '' ? section.item : 'Пункт' } `,
				// 	color: '000000',
				// }),
				// new TextRun({
				// 	text: `     ${ section.issueConsideration && section.issueConsideration.trim() !== '' ? section.issueConsideration : 'Вопрос' } `,
				// 	color: '000000',
				// }),
				// new TextRun({
				// 	text: `     ${ section.initiatedBy && section.initiatedBy.value ? section.initiatedBy.value : '' } `,
				// 	color: '000000',
				// }),
			];

			if (!speakers || typeof speakers !== 'object' || speakers.length <= 0) {
				return arr;
			}

			const result = [];

			speakers.forEach((speaker) => {
				result.push(new TextRun({
					text: `     ${ speaker.value }, `,
					color: '000000',
				}));
			});

			return [...arr, ...result];
		};

		const sectionsRow = agenda?.sections?.map((section) => new Paragraph({
			children: getSectionChildren(section, section.speakers),

				// new Paragraph({
				// 	children: [new TextRun({
				// 		text: `${ section.item && section.item.trim() !== '' ? section.item :  'Пункт' }`,
				// 	})],
				// 	heading: HeadingLevel.HEADING_5,
				// 	indent: { left: 100 },
				// }),
				// new Paragraph({
				// 	children: [new TextRun({
				// 		text: `${ section.issueConsideration && section.issueConsideration.trim() !== '' ? section.issueConsideration :  'Пункт' }`,
				// 	})],
				// 	heading: HeadingLevel.HEADING_5,
				// 	indent: { left: 100 },
				// }),
				// new Paragraph({
				// 	text: `${ section.issueConsideration && section.issueConsideration.trim() !== '' ? section.issueConsideration :  'Пункт' }`,
				// 	indent: { left: 100 },
				// 	heading: HeadingLevel.HEADING_5,
				// }),
				// new Paragraph({
				// 	text: `${ section.item && section.item.trim() !== '' ? section.item :  'Пункт' }`,
				// 	indent: { left: 100 },
				// }),
				// new Paragraph({
				// 	text: `${ section.item && section.item.trim() !== '' ? section.item :  'Пункт' }`,
				// 	indent: { left: 100 },
				// }),
				// new Paragraph({
				// 	text: `${ section.item && section.item.trim() !== '' ? section.item :  'Пункт' }`,
				// 	indent: { left: 100 },
				// }),
			// ],
			heading: HeadingLevel.HEADING_4,
			alignment: AlignmentType.LEFT,
		}) ) || [];

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [...agendaRow, ...sectionsRow],
		});

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
