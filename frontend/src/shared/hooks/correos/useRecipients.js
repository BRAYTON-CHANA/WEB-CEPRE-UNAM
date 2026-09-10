import { useCallback, useEffect, useState } from 'react';

function normalizeByEmail(list, excludeEmail) {
  const seen = new Set();
  return list.filter(r => {
    if (r.email === excludeEmail) return false;
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}

function moveOrSkip(next, source, current, others) {
  const result = [];
  next.forEach(item => {
    const existsInCurrent = current.some(c => c.email === item.email);
    if (existsInCurrent) {
      result.push(item);
      return;
    }
    const conflict = others.find(o => o.list.some(r => r.email === item.email));
    if (conflict) {
      const moved = window.confirm(`El correo ${item.email} ya está en ${conflict.field}. ¿Deseas moverlo a ${source}?`);
      if (moved) {
        conflict.setter(prev => prev.filter(r => r.email !== item.email));
        result.push(item);
      }
    } else {
      result.push(item);
    }
  });
  return result;
}

export function useRecipients(remitente) {
  const [para, setParaState] = useState([]);
  const [cc, setCcState] = useState([]);
  const [bcc, setBccState] = useState([]);

  useEffect(() => {
    if (!remitente) return;
    setParaState(prev => prev.filter(r => r.email !== remitente));
    setCcState(prev => prev.filter(r => r.email !== remitente));
    setBccState(prev => prev.filter(r => r.email !== remitente));
  }, [remitente]);

  const setPara = useCallback((next) => {
    const clean = normalizeByEmail(next, remitente);
    const final = moveOrSkip(clean, 'Para', para, [
      { field: 'CC', list: cc, setter: setCcState },
      { field: 'BCC', list: bcc, setter: setBccState },
    ]);
    setParaState(final);
  }, [remitente, para, cc, bcc]);

  const setCc = useCallback((next) => {
    const clean = normalizeByEmail(next, remitente);
    const final = moveOrSkip(clean, 'CC', cc, [
      { field: 'Para', list: para, setter: setParaState },
      { field: 'BCC', list: bcc, setter: setBccState },
    ]);
    setCcState(final);
  }, [remitente, para, cc, bcc]);

  const setBcc = useCallback((next) => {
    const clean = normalizeByEmail(next, remitente);
    const final = moveOrSkip(clean, 'BCC', bcc, [
      { field: 'Para', list: para, setter: setParaState },
      { field: 'CC', list: cc, setter: setCcState },
    ]);
    setBccState(final);
  }, [remitente, para, cc, bcc]);

  const destinatariosEmails = useCallback((list) => list.map(r => r.email), []);
  const userIds = useCallback((list) =>
    list.filter(r => r.type === 'user')
      .map(r => Number(r.id))
      .filter(id => !isNaN(id)),
  []);

  const clearRecipients = useCallback(() => {
    setParaState([]);
    setCcState([]);
    setBccState([]);
  }, []);

  return {
    para, setPara,
    cc, setCc,
    bcc, setBcc,
    destinatariosEmails,
    userIds,
    clearRecipients,
  };
}
