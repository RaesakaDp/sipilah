function initMap(){
  const center = (window.bins && window.bins.length) ? { lat: window.bins[0].lat, lng: window.bins[0].lng } : { lat:0, lng:0 };
  const map = new google.maps.Map(document.getElementById('map'), { center, zoom:14 });
  window.bins && window.bins.forEach(b=>{
    const marker = new google.maps.Marker({ position:{lat:b.lat,lng:b.lng}, map, title:b.name });
    const info = new google.maps.InfoWindow({ content:`<strong>${b.name}</strong><br/>Volume: ${Math.round(b.volume)}%<br/>Temp: ${b.temp}°C<br/><a href="detail.html?id=${b.id}">Open detail</a>` });
    marker.addListener('click', ()=> info.open(map, marker));
  });
}