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
	async downloadAgenda({ _id, dateString }) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadAgenda', field: '_id' });
		}

		const agenda = await Agendas.findOne({ _id });

		// const persons = Persons.find({ _id: { $in: council.invitedPersons.map((iPerson) => iPerson._id) } }) || [];

		if (!agenda) {
			throw new Meteor.Error('error-the-field-is-required', `The council with _id: ${ _id } doesn't exist`, { method: 'downloadAgenda', field: 'agenda' });
		}

		const doc = new Document();

		let usersRows = [
			new TableRow({
				tableHeader: true,
				children: [
					new TableCell({
						children: [new Paragraph({ text: '№', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 5,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Участник', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Электронная почта', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Номер телефона', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Заявлен', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
				],
			}),
		];

		const agengaRow = [
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

		const sectionsRow = agenda?.sections?.map((section) => new Paragraph({
			children: [
				new TextRun({
					text: `${ section.item && section.item.trim() !== '' ? section.item :  'Пункт' }`,
				}),
			],
			heading: HeadingLevel.HEADING_4,
			alignment: AlignmentType.LEFT,
		}) ) || [];

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [...agengaRow, ...sectionsRow],
		});
		doc.addSection({ size: { orientation: PageOrientation.LANDSCAPE }, children: sectionsRow });

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
