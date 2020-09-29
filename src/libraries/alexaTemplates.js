module.exports.audioTemplate = (title, description, buttons) => {
    const audioItems = [];

    // creating audio items

    if (title && title.length > 0) {
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: title
        });
    }

    if (description && description.length > 0) {
        if (audioItems.length > 0) {
            audioItems.push({
                type: "Silence",
                duration: 500,
            });
        }
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: description
        });
    }

    if (buttons && buttons.length > 0) {
        if (audioItems.length > 0) {
            audioItems.push({
                type: "Silence",
                duration: 500,
            });
        }
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: buttons.join(', ')
        });
    }

    // assembling whole document

    return {
        type: 'Alexa.Presentation.APLA.RenderDocument',
        token: 'audioDocumentToken',
        document: {
            type: 'APLA',
            version: '0.8',
            description: 'audio layout with a sequencer',
            mainTemplate: {
                parameters: ['payload'],
                items: [
                    {
                        type: 'Sequencer',
                        items: audioItems
                    }
                ]
            }
        }
    };
};

module.exports.displayTemplate = (title, description, buttons, image) => {
    let displayItems = [];
    let titleItem, descriptionItem, buttonsItem, imageItem;

    // creating display items

    if (title && title.length > 0) {
        titleItem = {
            type: "Text",
            width: "auto",
            height: "auto",
            text: title,
            fontSize: "40dp",
        };
    }

    if (description && description.length > 0) {
        descriptionItem = {
            type: "Text",
            width: "auto",
            height: "auto",
            shrink: 1,
            grow: 1,
            text: description,
            fontSize: "30dp",
            paddingRight: "@spacingSmall",
        };
    }

    if (buttons && buttons.length > 0) {
        buttonsItem = {
            type: "Container",
            direction: "row",
            width: "100%",
            wrap: "wrap",
            data: buttons,
            item: {
                type: "AlexaButton",
                id: "Button${index}",
                buttonText: "${data}",
                buttonStyle: "contained",
                accessibilityLabel: "${data}",
                primaryAction: [{type: "SendEvent", arguments: ["${data}"]}],
            },
        };
    }

    if (image) {
        imageItem = {
            type: "AlexaImage",
            imageSource: image,
            imageScale: "best-fit",
            imageAlignment: "center",
            imageAspectRatio: "square",
            imageBlurredBackground: true,
            imageRoundedCorner: true,
        };
    }

    // set up display logic

    if (titleItem) {
        displayItems = [titleItem];
    }

    if (imageItem) {
        displayItems.push({
            type: "Container",
            width: "100%",
            height: "auto",
            direction: "row",
            justifyContent: "spaceBetween",
            alignSelf: "center",
            alignItems: "center",
            items: [
                descriptionItem,
                imageItem
            ],
        });
    } else {
        displayItems.push(descriptionItem);
    }

    if (buttonsItem) {
        displayItems.push(buttonsItem);
    }

    // assembling whole document

    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'displayDocumentToken',
        document: {
            type: 'APL',
            version: '1.4',
            theme: 'dark',
            description: 'display template: title, text, button, image',
            import: [{name: 'alexa-layouts', version: '1.2.0'}],
            mainTemplate: {
                parameters: ['payload'],
                items: [
                    {
                        type: "Container",
                        direction: "column",
                        height: "100%",
                        width: "100%",
                        paddingTop: "@spacingSmall",
                        paddingRight: "@spacingSmall",
                        paddingBottom: "@spacingSmall",
                        paddingLeft: "@spacingSmall",
                        justifyContent: "spaceAround",
                        items: displayItems,
                    }
                ]
            }
        }
    };
};
