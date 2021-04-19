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

import { Protocols } from '../../../models';
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

function getProtocolSectionParagraphs(protocol) {
	if (!protocol || !protocol.sections) {
		return [];
	}

	const result = [];

	protocol.sections.forEach((section, sectionIndex) => {
		// console.dir({ section });
		result.push(new Paragraph({
			children: [
				new TextRun({
					text: [section.num ? romanize(section.num) : 'section num', '. ', section.name ? preProcessingProtocolItems(section.name, 'section') : ''].join(''),
				}),
			],
			alignment: AlignmentType.CENTER,
			border: {
				bottom: {
					color: 'black',
					space: 6,
					value: 'single',
					size: 6,
				},
			},
			spacing: {
				after: 300,
			},
			style: 'defaultFontStyle',
		}));

		if (section.items) {
			section.items.forEach((item, index) => {
				result.push(new Paragraph({
					children: [
						new TextRun({
							text: [item.num ?? 'item num', '. ', item.name ? preProcessingProtocolItems(item.name, 'item') : ''].join(''),
						}),
					],
					indent: {
						firstLine: 1080,
					},
					style: 'defaultFontStyle',
				}));
			});
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
	async defaultProtocolTemplate({ protocolId }) {

		if (!protocolId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field protocolId is required', { method: 'defaultProtocolTemplate', field: 'protocolId' });
		}

		const protocol = await Protocols.findOne({ _id: protocolId });

		const sectionsParagraphs = getProtocolSectionParagraphs(protocol);

		const participantsParagraphs = await getParticipants(protocol);

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
							size: 24,
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

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [
				new Paragraph({
					children: [
						new TextRun({
							text: 'ПРОТОКОЛ',
							bold: true,
						}),
					],
					style: 'defaultFontStyle',
					alignment: AlignmentType.CENTER,
				}),

				new Paragraph({
					children: [
						new TextRun({
							text: 'Заседания комиссии Государственного совета Российской Федерации',
						}),
						new TextRun({
							text: '',
							break: 1,
						}),
						new TextRun({
							text: 'по направлению «Транспорт»',
						}),
					],
					style: 'defaultFontStyle',
					alignment: AlignmentType.CENTER,
				}),

				new Paragraph({
					children: [
						new TextRun({
							text: protocol?.place ?? 'Место проведения',
						}),
					],
					style: 'defaultFontStyle',
					alignment: AlignmentType.CENTER,
				}),

				new Paragraph({
					children: [
						new TextRun({
							text: protocol?.d ? moment(new Date(protocol.d)).format('DD MMMM YYYY') : 'Дата проведения',

						}),
						new TextRun({
							text: [...getMaxTabs(16), '№', protocol?.num ?? 'Номер'].join(''),
						}),
					],
					tabStops: [
						{
							type: TabStopType.END,
							// position: TabStopPosition.MAX,
						},
					],
					style: 'defaultFontStyle',
				}),

				new Paragraph({
					children: [
						new TextRun({
							text: 'Присутствовали: список участников прилагается (Приложение 1)',
						}),
					],
					style: 'defaultFontStyle',
				}),

				sectionsParagraphs?.map((section) => section),

				new Paragraph({
					children: [
						new TextRun({
							text: 'Соответствующие предложения подготовить для рассмотрения на заседании Правительственной комиссии по транспорту.',
						}),
					],
					indent: {
						firstLine: 1080,
					},
					style: 'defaultFontStyle',
				}),
			],
		});

		// console.dir({ participantsParagraphs });

		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [
				new Paragraph({
					children: [
						new TextRun({
							text: 'Приложение 1',
							bold: true,
						}),
					],
					style: 'defaultFontStyle',
					alignment: AlignmentType.CENTER,
				}),

				new Paragraph({
					children: [
						new TextRun({
							text: 'Участники протокола',
						}),
					],
					style: 'defaultFontStyle',
					alignment: AlignmentType.CENTER,
				}),

				participantsParagraphs?.map((paragraph) => paragraph),
			],
		});

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
