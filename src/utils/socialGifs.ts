export const SocialGifs = {
  abracar: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/qhdudCrSMOFQHSmp.gif',
  abracoFalhou: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/XVvZGRoBAqJEQqMV.gif',
  agarrar: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/FBEjitGEWwcYoBjk.gif',
  desviou: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/DNfPZJEnMqIzsrXz.gif',
  beijar1: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/NkxuleDvjwZxOHjO.gif',
  beijar2: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/AxSXxGqedwAtLXBJ.gif',
  beijar3: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/sBLrlYMmtHurKFXC.gif',
  casar: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/WrYYNNNKcQDCHFsF.gif',
  pescando: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/gDDDpxfiXrcrsQWt.gif',
  punicao: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/EOCnRRXukQRhfuWU.gif',
  raivaVermelho: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/hxsNMmJckBlUfYKj.gif',
  raivaDente: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/FLccANbHhiaAeYLR.gif',
  tapa: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031044102/XbRudYpkgassamrx.gif',

  getRandomKiss() {
    const kisses = [this.beijar1, this.beijar2, this.beijar3];
    return kisses[Math.floor(Math.random() * kisses.length)];
  }
};
