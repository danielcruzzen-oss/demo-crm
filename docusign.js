const DOCUSIGN_API = 'https://demo.docusign.net/restapi/v2.1';

async function createEnvelope(deal) {
  const token = await getAccessToken();

  const envelope = {
    emailSubject: `Contrato comercial: ${deal.nombre}`,
    documents: [
      {
        documentId: '1',
        name: 'contrato.pdf',
        fileExtension: 'pdf',
        documentBase64: generateContractBase64(deal),
      },
    ],
    recipients: {
      signers: [
        {
          email: deal.email,
          name: deal.contacto,
          recipientId: '1',
          tabs: {
            signHereTabs: [{ documentId: '1', pageNumber: '1', xPosition: '200', yPosition: '400' }],
          },
        },
      ],
    },
    status: 'sent',
  };

  const res = await fetch(`${DOCUSIGN_API}/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelope),
  });

  return res.json();
}

function generateContractBase64(deal) {
  // BUG: se pasa deal.nombre pero el template espera deal.nombre_completo
  // El PDF se genera vacío porque la variable no resuelve
  const content = `CONTRATO COMERCIAL\n\nCliente: ${deal.nombre_completo}\nEmpresa: ${deal.empresa}\nValor: $${deal.valor}\n\nFirma: _______________`;
  return Buffer.from(content).toString('base64');
}

async function getAccessToken() {
  return process.env.DOCUSIGN_ACCESS_TOKEN || '';
}

module.exports = { createEnvelope };
