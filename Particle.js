/*

	Author: Silviu Schiau (@sschiau on Twitter)
	Web: www.schiau.co
	File: Particle.js
	Created: 1393394887905 (UNIX Time)
	Modified: 1393394887905 (UNIX Time)
	About: JavaScript implementation of Twitter Snowflake ID Generator (Extended to 42bits epoch for 96 years 1 month 21 days 16 hours 42 minutes 24 seconds in the future)
	License: Apache License Version 2.0 http://www.apache.org/licenses/LICENSE-2.0.txt

	Thanks to Twitter for Snowflake.
	This header should NOT be removed if you want to use Particle.
    
*/

function Particle()
{
    const epoch = 1393394887905;
    
    this.generateParticle = function(machine_id)
    {
        // Time - 42 bits (millisecond precision w/ a custom epoch gives us 96 years 1 month 21 days 16 hours 42 minutes 24 seconds in the future)
        time = Math.floor(new Date());
        
        // Substract custom epoch from current time
        time -= epoch;
        
        // Add to base
        base = Math.pow(2,41);
        base += time;
        base = base.toString(2);
        
        // Configured machine id - 10 bits - to 1024 machines
        machine_id = machine_id.toString(2);
        
        // Sequence number - 12 bits - up to 4096 random numbers per machine
        random = Math.floor(Math.random() * (Math.pow(2,12)-1));
        random = random.toString(2);
        
        // Pack
        base = base + machine_id + random;
        
        return parseInt(base, 2);
    }

    this.timeFromParticle = function(particle)
    {
        return parseInt(particle.toString(2).substring(0,42), 2) - Math.pow(2,41) + epoch;
    }
}