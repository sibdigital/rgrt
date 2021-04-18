import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

import fs from 'fs';
import officegen from 'officegen';
import Buffer from 'buffer';
import async from 'async';
import request from 'request';

Meteor.methods({
	downloadTestServer(protocolId) {
        if (!protocolId) {
            throw new Meteor.Error('Protocol_Error_Invalid_Protocol_Id', 'Invalid protocolId', { method: 'downloadTestServer' });
        }

        const protocol = Protocols.findOneById(protocolId);

		if (protocol == null) {
			throw new Meteor.Error('Protocol_Error_Invalid_Protocol', 'Invalid protocol', { method: 'downloadTestServer' });
		}


        let docx = officegen('docx')

        let pObj = docx.createP()

        pObj.addText('Simple')
        pObj.addText(' with color', { color: '000088' })
        pObj.addText(' and back color.', { color: '00ffff', back: '000088' })

        pObj = docx.createP()

        pObj.addText('Since ')
        pObj.addText('officegen 0.2.12', {
            back: '00ffff',
            shdType: 'pct12',
            shdColor: 'ff0000'
            }
        ) // Use pattern in the background.
        pObj.addText(' you can do ')
        pObj.addText('more cool ', { highlight: true }) // Highlight!
        pObj.addText('stuff!', { highlight: 'darkGreen' }) // Different highlight color.

        pObj = docx.createP()

        pObj.addText('Even add ')
        pObj.addText('external link', { link: 'https://github.com' })
        pObj.addText('!')

        pObj = docx.createP()

        pObj.addText('Bold + underline', { bold: true, underline: true })

        pObj = docx.createP({ align: 'center' })

        pObj.addText('Center this text', {
            border: 'dotted',
            borderSize: 12,
            borderColor: '88CCFF'
        })

        pObj = docx.createP()
        pObj.options.align = 'right'

        pObj.addText('Align this text to the right.')

        pObj = docx.createP()

        pObj.addText('Those two lines are in the same paragraph,')
        pObj.addLineBreak()
        pObj.addText('but they are separated by a line break.')

        docx.putPageBreak()

        pObj = docx.createP()

        pObj.addText('Fonts face only.', { font_face: 'Arial' })
        pObj.addText(' Fonts face and size.', { font_face: 'Arial', font_size: 40 })

        docx.putPageBreak()

        pObj = docx.createP()


        const filename = 'example.docx';
        let file = fs.createWriteStream(filename);

        const middleWare = async () => {
            await docx.generate(file);
            const sendReq = request.get(`/${ filename }`);
            sendReq.on('response', (response) => {
                if (response.statusCode !== 200) {
                    console.log('Response status was ' + response.statusCode);
                    return;
                }
        
                sendReq.pipe(file);
            });
        
            // close() is async, call cb after close completes
            file.on('finish', () => file.close(cb));
        
            // check for request errors
            sendReq.on('error', (err) => {
                fs.unlink(filename);
                console.log(err.message);
                return;
            });
        
            file.on('error', (err) => { // Handle errors
                fs.unlink(filename); // Delete the file async. (But we don't check the result)
                console.log(err.message);
                return;
            });
        };
        middleWare();


        // out.on('error', function (err) {
        //     console.log(err)
        //   })
          
        // async.parallel(
        //     [
        //       function (done) {
        //         out.on('close', function () {
        //           console.log('Finish to create a DOCX file.')
        //           done(null)
        //         })
        //         docx.generate(out)
        //       }
        //     ],
        //     function (err) {
        //       if (err) {
        //         console.log('error: ' + err)
        //       } // Endif.
        //     }
        //   )

        // console.log({ bytes: out.bytesWritten });  
        // return { ...out, name: 'example.docx' }; 
        // var arrByte = new Uint8Array.from(Buffer.from(out))
        // var binaryData = new Blob([arrByte])
        // if (err) {
        //     throw new Meteor.Error('error', `Invalid binary data`, { method: 'downloadTestServer' });
        // }
        // return { type: 'docx', file: arrByte, name: 'example.docx' };
	},
});
