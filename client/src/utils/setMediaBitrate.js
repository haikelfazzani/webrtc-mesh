export default function setMediaBitrate(sdp, bandwidth = 125) {
  let arr = sdp.split('\r\n') || [];
  let modifier = 'AS';

  arr.forEach((str, i) => {
    if (/^a=fmtp:\d*/gim.test(str)) {
      arr[i] = str + ';x-google-max-bitrate=125;x-google-min-bitrate=0;x-google-start-bitrate=25';
    } else if (/^a=mid:(1|video)/gim.test(str)) {
      arr[i] += '\r\nb=AS:125';
    }
  });

  let updatedSdp = arr.join('\r\n');

  if (updatedSdp.indexOf('b=' + modifier + ':') === -1) {
    // insert b= after c= line.
    updatedSdp = updatedSdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
  }


  // updatedSdp += 'b=AS:125\r\n';
  // console.log(updatedSdp);
  return updatedSdp
};