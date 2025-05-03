module.exports = {
    'generate_react_component':{
        action:async (seed, messages)=>{
            const { componentName, description } = seed.args;

            const systemPrompt = `
        Eres un asistente experto en React. Tu tarea es generar un componente funcional en React llamado "${componentName}".
        Debe cumplir con esta descripción: "${description}".

        Requisitos:
        - Usa React funcional con hooks si es necesario.
        - Exporta el componente por default.
        - Usa estilo limpio y profesional.
        `;

            const conversation = [
            { role: "system", content: systemPrompt },
            ...messages,
            ];

            const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: conversation,
            });

            const reply = openaiResponse.choices[0].message;
            const filePath = `./src/${componentName}.jsx`;
            const step = {
                type: "update_file",
                path: filePath,
                content: reply.content,
              }
            return { step, reply };
        }
    }
}