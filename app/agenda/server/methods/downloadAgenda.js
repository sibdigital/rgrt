import { Meteor } from 'meteor/meteor';
import {
	AlignmentType,
	Document,
	HeadingLevel,
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

function constructPersonFIO(responsible) {
	if (!responsible || typeof responsible !== 'object') {
		return responsible;
	}
	if (!responsible.surname && !responsible.name && !responsible.patronymic) {
		return responsible;
	}
	return [responsible.surname ?? '', ' ', responsible.name?.substr(0, 1) ?? '', '.', responsible.patronymic?.substr(0, 1) ?? '', '.'].join('');
}

Meteor.methods({
	async downloadAgenda({ _id, dateString = null }) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadAgenda', field: '_id' });
		}

		const agenda = await Agendas.findOne({ _id });
		const isHaveProposals = agenda?.sections?.filter((_agenda) => _agenda.initiatedBy?._id).length > 0;

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

		const getSectionsRows = () => {
			const arr = [];
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: 'Пункт', bold: true, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
				}),
			);
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: 'Рассматриваемый вопрос', bold: true, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
				}),
			);
			isHaveProposals && arr.push(
				new TableCell({
					children: [new Paragraph({ text: 'Ответственный', bold: true, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
				}),
			);
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: 'Выступающие', bold: true, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
				}),
			);
			return arr;
		};

		let sectionsRows = [
			new TableRow({
				tableHeader: true,
				children: getSectionsRows(),
			}),
		];

		const getSectionsCell = (value, index) => {
			const arr = [];
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: `${ value.item ?? index + 1 }`, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
					alignment: AlignmentType.CENTER,
				}),
			);
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: `${ value.issueConsideration ?? '' }`.trim(), alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
					alignment: AlignmentType.CENTER,
				}),
			);
			isHaveProposals && arr.push(
				new TableCell({
					children: [new Paragraph({ text: `${ value.initiatedBy?.value ?? '' }`, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
					alignment: AlignmentType.CENTER,
				}),
			);
			arr.push(
				new TableCell({
					children: [new Paragraph({ text: `${ value.speakers?.map((speaker) => constructPersonFIO(speaker)).join(' ') ?? '' }`, alignment: AlignmentType.CENTER })],
					verticalAlign: VerticalAlign.CENTER,
					alignment: AlignmentType.CENTER,
				}),
			);
			return arr;
		};

		sectionsRows = sectionsRows.concat(agenda?.sections?.map((value, index) => {
			return new TableRow({
				children: getSectionsCell(value, index),
			});
		}));

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [
				...agendaRow,
				new Table({
					rows: sectionsRows,
					width: {
						size: 100,
						type: WidthType.PERCENTAGE,
					},
					cantSplit: true,
				})
			],
		});

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
